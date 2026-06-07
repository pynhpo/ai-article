import { Module } from '@nestjs/common';
import { LlmController } from './controllers/llm.controller';
import { AILlmService } from './services/llm.service';

@Module({
  controllers: [LlmController],
  providers: [AILlmService],
})
export class AIModule {}
