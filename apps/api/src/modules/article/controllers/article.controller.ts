import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
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

  /**
   * POST /articles/save
   *
   * Save the current guest article as a new article for the logged-in user.
   * Frontend must provide the guestSessionId that was active before login.
   */
  @Post('save')
  async saveArticle(
    @Body('guestSessionId') guestSessionId: string,
    @User() session: SessionUser,
  ) {
    if (session.isGuest) {
      throw new ForbiddenException(
        'You must be logged in to save articles. Please sign in first.',
      );
    }

    if (!guestSessionId) {
      throw new NotFoundException('No guest session ID provided');
    }

    const savedArticle = await this.articleService.saveArticleForUser(
      session.id,
      guestSessionId,
    );

    return {
      id: savedArticle.id,
      title: savedArticle.title,
    };
  }

  /**
   * GET /articles
   *
   * Returns all articles for the logged-in user (history list).
   */
  @Get()
  async getUserArticles(@User() session: SessionUser) {
    const userArticles = await this.articleService.getUserArticles(session.id);

    return userArticles.map((article) => ({
      id: article.id,
      title: article.title,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      // Include a preview snippet from intro hook
      preview: this.getPreviewSnippet(article.intro),
    }));
  }

  /**
   * GET /articles/:id
   *
   * Returns a single article with full data including editor content.
   */
  @Get(':id')
  async getArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @User() session: SessionUser,
  ) {
    const article = await this.articleService.getArticleById(id, session.id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return {
      id: article.id,
      title: article.title,
      intro: article.intro,
      mainBody: article.mainBody,
      bestFor: article.bestFor,
      ethics: article.ethics,
      keyFacts: article.keyFacts,
      editorContent: article.editorContent,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }

  /**
   * PATCH /articles/:id/editor
   *
   * Update the BlockNote editor content for an article.
   */
  @Patch(':id/editor')
  async updateEditorContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('editorContent') editorContent: unknown,
    @User() session: SessionUser,
  ) {
    const updated = await this.articleService.updateEditorContent(
      id,
      session.id,
      editorContent,
    );

    if (!updated) {
      throw new NotFoundException('Article not found');
    }

    return { success: true };
  }

  /**
   * PATCH /articles/:id/title
   *
   * Update the title of an article.
   */
  @Patch(':id/title')
  async updateTitle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('title') title: string,
    @User() session: SessionUser,
  ) {
    const updated = await this.articleService.updateTitle(
      id,
      session.id,
      title,
    );

    if (!updated) {
      throw new NotFoundException('Article not found');
    }

    return { success: true };
  }

  /**
   * DELETE /articles/:id
   *
   * Delete an article owned by the logged-in user.
   */
  @Delete(':id')
  async deleteArticle(
    @Param('id', ParseUUIDPipe) id: string,
    @User() session: SessionUser,
  ) {
    const deleted = await this.articleService.deleteArticle(id, session.id);

    if (!deleted) {
      throw new NotFoundException('Article not found');
    }

    return { success: true };
  }

  // ─── Helpers ────────────────────────────────────────────

  private getPreviewSnippet(intro: unknown): string {
    if (
      !intro ||
      typeof intro !== 'object' ||
      !('hook' in intro) ||
      typeof intro.hook !== 'string'
    ) {
      return '';
    }

    const hook = (intro as { hook: string }).hook;
    const maxLength = 120;
    return hook.length > maxLength
      ? `${hook.substring(0, maxLength)}...`
      : hook;
  }
}
