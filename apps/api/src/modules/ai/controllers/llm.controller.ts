import { Controller, Post, Body, Res } from '@nestjs/common';
import * as express from 'express';

import { AILlmService } from '@/modules/ai/services/llm.service';
import { GenerateTravelArticleDto } from '@/modules/ai/dto/llm.dto';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller('ai/llm')
export class LlmController {
  constructor(private readonly aiLlmService: AILlmService) {}

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
  generateTravelArticle(
    @Body() dto: GenerateTravelArticleDto,
    @Res() res: express.Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    this.aiLlmService.generateTravelArticle(dto.roughNotes).subscribe({
      next: (event) => {
        res.write(
          `event: ${event.section}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
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
