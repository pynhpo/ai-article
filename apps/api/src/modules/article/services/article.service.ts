import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { type Database } from '../../database/database.module';
import { articles } from '../../database/schema';
import type { ArticleSectionName } from '../../integration/types/article.type';

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
  async getArticleBySession(sessionId: string, isGuest: boolean) {
    const [article] = await this.db
      .select()
      .from(articles)
      .where(
        and(eq(articles.sessionId, sessionId), eq(articles.isGuest, isGuest)),
      )
      .limit(1);

    return article ?? null;
  }
}
