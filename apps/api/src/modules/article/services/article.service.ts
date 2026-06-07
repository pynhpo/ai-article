import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { type Database } from '../../database/database.module';
import { articles } from '../../database/schema';
import { type Article } from '../../database/articles';
import type { ArticleSectionName } from '../../integration/types/article.type';

/** Max words to use from intro hook for auto-generated title */
const TITLE_MAX_WORDS = 12;

/** Column name mapping from section names to DB JSONB columns */
const SECTION_COLUMN_MAP: Record<
  ArticleSectionName,
  'intro' | 'mainBody' | 'bestFor' | 'ethics' | 'keyFacts'
> = {
  intro: 'intro',
  mainBody: 'mainBody',
  bestFor: 'bestFor',
  ethics: 'ethics',
  keyFacts: 'keyFacts',
};

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name);

  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Database) {}

  // ─── Staging Methods ────────────────────────────────────
  // Staging = temporary article being generated via SSE.
  // One staging article per session, identified by (sessionId, isGuest).

  /**
   * Upsert a single section into the staging article row.
   * Creates the row if it doesn't exist, otherwise updates the section column.
   */
  async upsertStagingSection(
    sessionId: string,
    isGuest: boolean,
    sectionName: ArticleSectionName,
    data: unknown,
  ): Promise<void> {
    const column = SECTION_COLUMN_MAP[sectionName];

    await this.db
      .insert(articles)
      .values({
        sessionId,
        isGuest,
        [column]: data,
      })
      .onConflictDoUpdate({
        target: [articles.sessionId, articles.isGuest],
        set: { [column]: data },
      });

    this.logger.debug(
      `Upserted section "${sectionName}" for session ${sessionId.substring(0, 8)}`,
    );
  }

  /**
   * Reset all sections for a staging article before starting a new generation.
   * This ensures stale sections from a previous generation are cleared.
   */
  async resetStagingArticle(
    sessionId: string,
    isGuest: boolean,
    roughNotes?: string,
  ): Promise<void> {
    await this.db
      .insert(articles)
      .values({
        sessionId,
        isGuest,
        roughNotes: roughNotes ?? null,
        intro: null,
        mainBody: null,
        bestFor: null,
        ethics: null,
        keyFacts: null,
      })
      .onConflictDoUpdate({
        target: [articles.sessionId, articles.isGuest],
        set: {
          roughNotes: roughNotes ?? null,
          intro: null,
          mainBody: null,
          bestFor: null,
          ethics: null,
          keyFacts: null,
        },
      });

    this.logger.debug(
      `Reset staging article for session ${sessionId.substring(0, 8)}`,
    );
  }

  /**
   * Retrieve the current staging article for a session.
   * Returns null if no article exists.
   */
  async getStagingArticle(
    sessionId: string,
    isGuest: boolean,
  ): Promise<Article | null> {
    const [article] = await this.db
      .select()
      .from(articles)
      .where(
        and(eq(articles.sessionId, sessionId), eq(articles.isGuest, isGuest)),
      )
      .limit(1);

    return article ?? null;
  }

  // ─── Registered User Methods ────────────────────────────

  /**
   * Save a staging article as a new permanent article owned by a registered user.
   * Copies all 5 sections from the staging row and generates a title from the intro hook.
   *
   * The saved article gets its own random sessionId so it doesn't conflict
   * with the staging row's unique constraint (sessionId, isGuest).
   */
  async saveArticleForUser(
    userId: string,
    stagingSessionId: string,
    stagingIsGuest: boolean,
  ): Promise<Article> {
    const staging = await this.getStagingArticle(
      stagingSessionId,
      stagingIsGuest,
    );

    if (!staging) {
      throw new Error('No staging article found to save');
    }

    const title = this.generateTitle(staging.intro);

    const [savedArticle] = await this.db
      .insert(articles)
      .values({
        sessionId: randomUUID(),
        isGuest: false,
        userId,
        title,
        roughNotes: staging.roughNotes,
        intro: staging.intro,
        mainBody: staging.mainBody,
        bestFor: staging.bestFor,
        ethics: staging.ethics,
        keyFacts: staging.keyFacts,
      })
      .returning();

    this.logger.log(
      `Saved article "${title}" for user ${userId.substring(0, 8)}`,
    );
    return savedArticle;
  }

  /**
   * Get all articles belonging to a registered user, ordered by most recent.
   */
  async getUserArticles(userId: string): Promise<Article[]> {
    return this.db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.userId, userId),
          eq(articles.isGuest, false),
          isNotNull(articles.mainBody),
        ),
      )
      .orderBy(desc(articles.updatedAt));
  }

  /**
   * Get a single article by ID, ensuring it belongs to the given user.
   */
  async getArticleById(
    articleId: string,
    userId: string,
  ): Promise<Article | null> {
    const [article] = await this.db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.id, articleId),
          eq(articles.userId, userId),
          eq(articles.isGuest, false),
        ),
      )
      .limit(1);

    return article ?? null;
  }

  /**
   * Update the BlockNote editor content for an article.
   */
  async updateEditorContent(
    articleId: string,
    userId: string,
    editorContent: unknown,
  ): Promise<Article | null> {
    const [updated] = await this.db
      .update(articles)
      .set({ editorContent })
      .where(
        and(
          eq(articles.id, articleId),
          eq(articles.userId, userId),
          eq(articles.isGuest, false),
        ),
      )
      .returning();

    return updated ?? null;
  }

  /**
   * Update the title for an article.
   */
  async updateTitle(
    articleId: string,
    userId: string,
    title: string,
  ): Promise<Article | null> {
    const [updated] = await this.db
      .update(articles)
      .set({ title })
      .where(
        and(
          eq(articles.id, articleId),
          eq(articles.userId, userId),
          eq(articles.isGuest, false),
        ),
      )
      .returning();

    return updated ?? null;
  }

  /**
   * Delete an article, ensuring it belongs to the given user.
   */
  async deleteArticle(articleId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(articles)
      .where(
        and(
          eq(articles.id, articleId),
          eq(articles.userId, userId),
          eq(articles.isGuest, false),
        ),
      )
      .returning({ id: articles.id });

    return result.length > 0;
  }

  // ─── Helpers ────────────────────────────────────────────

  /**
   * Generate a short title from the intro hook (first N words).
   */
  private generateTitle(intro: unknown): string {
    if (
      !intro ||
      typeof intro !== 'object' ||
      !('hook' in intro) ||
      typeof intro.hook !== 'string'
    ) {
      return 'Untitled Article';
    }

    const hook = (intro as { hook: string }).hook;
    const words = hook.split(/\s+/).slice(0, TITLE_MAX_WORDS);
    const title = words.join(' ');

    return words.length < hook.split(/\s+/).length ? `${title}...` : title;
  }
}
