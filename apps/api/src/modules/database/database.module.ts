import { Global, Module } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

export type Database = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (configService: ConfigService): Database => {
        const connectionString = configService.get<string>('DATABASE_URL');
        const client = postgres(connectionString!);
        return drizzle(client, { schema });
      },
      inject: [ConfigService],
    },
    DatabaseService,
  ],
  exports: ['DATABASE_CONNECTION', DatabaseService],
})
export class DatabaseModule {}
