import { Injectable, Logger, Inject } from '@nestjs/common';

import { type Database } from '../../database/database.module';

@Injectable()
export class AILlmService {
  private readonly logger = new Logger(AILlmService.name);

  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Database) {}
}
