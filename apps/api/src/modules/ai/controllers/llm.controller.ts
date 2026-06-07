import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import * as express from 'express';

import { AILlmService } from '@/modules/ai/services/llm.service';
import { GenerateTravelArticleDto } from '@/modules/ai/dto/llm.dto';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { User } from '@/modules/auth/decorators/user.decorator';
import type { SessionUser } from '@/modules/auth/types/user.type';
import { ArticleService } from '@/modules/article/services/article.service';
import type { ArticleSectionName } from '@/modules/integration/types/article.type';

const ARTICLE_SECTION_NAMES: Set<string> = new Set([
  'intro',
  'mainBody',
  'bestFor',
  'ethics',
  'keyFacts',
]);

@Controller('ai/llm')
export class LlmController {
  private readonly logger = new Logger(LlmController.name);

  constructor(
    private readonly aiLlmService: AILlmService,
    private readonly articleService: ArticleService,
  ) {}

  /**
   * POST /ai/llm/travel-article
   *
   * Receives rough travel notes and streams back structured magazine article
   * sections via Server-Sent Events (SSE). Each section is emitted as soon
   * as the LLM completes it (first-come-first-served).
   *
   * Event types: intro | mainBody | bestFor | ethics | keyFacts | complete | error
   */
  @Post('travel-article')
  @Public()
  async generateTravelArticle(
    @Body() dto: GenerateTravelArticleDto,
    @User() session: SessionUser,
    @Res() res: express.Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Reset the staging article before starting a new generation
    await this.articleService.resetStagingArticle(
      session.id,
      session.isGuest ?? false,
      dto.roughNotes,
    );

    this.aiLlmService.generateTravelArticle(dto.roughNotes).subscribe({
      next: (event) => {
        res.write(
          `event: ${event.section}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );

        // Persist each completed section to the staging article (fire-and-forget)
        if (ARTICLE_SECTION_NAMES.has(event.section)) {
          this.articleService
            .upsertStagingSection(
              session.id,
              session.isGuest ?? false,
              event.section as ArticleSectionName,
              event.data,
            )
            .catch((err) => {
              this.logger.error(
                `Failed to persist section "${event.section}" for session ${session.id.substring(0, 8)}`,
                err,
              );
            });
        }
      },
      error: (err) => {
        const message = err instanceof Error ? err.message : String(err);
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });
  }
}
