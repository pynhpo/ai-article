import { articles } from '../schema';

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
