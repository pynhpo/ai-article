import { Module, Global } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { ArticleController } from './controllers/article.controller';

@Global()
@Module({
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
