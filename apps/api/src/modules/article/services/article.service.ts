import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
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

  // ─── Guest Methods ──────────────────────────────────────

  /**
   * Upsert a single section into the guest's article row.
   * Creates the row if it doesn't exist, otherwise updates the section column.
   */
  async upsertGuestSection(
    sessionId: string,
    sectionName: ArticleSectionName,
    data: unknown,
  ): Promise<void> {
    const column = SECTION_COLUMN_MAP[sectionName];

    await this.db
      .insert(articles)
      .values({
        sessionId,
        isGuest: true,
        [column]: data,
      })
      .onConflictDoUpdate({
        target: [articles.sessionId, articles.isGuest],
        set: { [column]: data },
      });

    this.logger.debug(
      `Upserted section "${sectionName}" for guest ${sessionId.substring(0, 8)}`,
    );
  }

  /**
   * Reset all sections for a guest before starting a new generation.
   * This ensures stale sections from a previous generation are cleared.
   */
  async resetGuestArticle(sessionId: string): Promise<void> {
    await this.db
      .insert(articles)
      .values({
        sessionId,
        isGuest: true,
        intro: null,
        mainBody: null,
        bestFor: null,
        ethics: null,
        keyFacts: null,
      })
      .onConflictDoUpdate({
        target: [articles.sessionId, articles.isGuest],
        set: {
          intro: null,
          mainBody: null,
          bestFor: null,
          ethics: null,
          keyFacts: null,
        },
      });

    this.logger.debug(`Reset article for guest ${sessionId.substring(0, 8)}`);
  }

  /**
   * Retrieve the current article for a session (guest or logged-in).
   * Returns null if no article exists.
   */
  async getArticleBySession(
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
   * Save a guest article as a new article owned by a registered user.
   * Copies all 5 sections from the guest article and generates a title
   * from the intro hook.
   */
  async saveArticleForUser(
    userId: string,
    guestSessionId: string,
  ): Promise<Article> {
    const guestArticle = await this.getArticleBySession(guestSessionId, true);

    if (!guestArticle) {
      throw new Error('No guest article found to save');
    }

    const title = this.generateTitle(guestArticle.intro);

    const [savedArticle] = await this.db
      .insert(articles)
      .values({
        sessionId: userId,
        isGuest: false,
        userId,
        title,
        intro: guestArticle.intro,
        mainBody: guestArticle.mainBody,
        bestFor: guestArticle.bestFor,
        ethics: guestArticle.ethics,
        keyFacts: guestArticle.keyFacts,
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
      .where(and(eq(articles.userId, userId), eq(articles.isGuest, false)))
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
