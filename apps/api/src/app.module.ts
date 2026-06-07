import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SessionMiddleware } from './modules/auth/middlewares/session.middleware';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { AIModule } from './modules/ai/ai.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ArticleModule } from './modules/article/article.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AuthModule,
    AIModule,
    IntegrationModule,
    DatabaseModule,
    ArticleModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
