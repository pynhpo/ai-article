import { Controller, Inject } from '@nestjs/common';
import { LlmService } from '@/modules/integration/services/llm.service';
import type { Database } from '@/modules/database/database.module';

@Controller('ai/llm')
export class LlmController {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Database,
    private readonly llmService: LlmService,
  ) {}
}
