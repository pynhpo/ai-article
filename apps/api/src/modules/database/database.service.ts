import { Inject, Injectable } from '@nestjs/common';
import { type Database } from './database.module';

@Injectable()
export class DatabaseService {
  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Database) {}
}
