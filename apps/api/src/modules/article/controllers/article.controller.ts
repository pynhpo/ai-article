import { Controller, Get } from '@nestjs/common';
import { ArticleService } from '../services/article.service';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { User } from '@/modules/auth/decorators/user.decorator';
import type { SessionUser } from '@/modules/auth/types/user.type';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /**
   * GET /articles/current
   *
   * Returns the current article for the session user (guest or logged-in).
   * Returns null if no article has been generated yet.
   */
  @Get('current')
  @Public()
  async getCurrentArticle(@User() session: SessionUser) {
    const isGuest = session.isGuest ?? false;
    const article = await this.articleService.getArticleBySession(
      session.id,
      isGuest,
    );

    if (!article) {
      return { article: null };
    }

    return {
      article: {
        intro: article.intro,
        mainBody: article.mainBody,
        bestFor: article.bestFor,
        ethics: article.ethics,
        keyFacts: article.keyFacts,
      },
    };
  }
}
