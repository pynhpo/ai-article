import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  boolean,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: varchar('session_id', { length: 255 }).notNull(),
    isGuest: boolean('is_guest').default(true).notNull(),
    intro: jsonb('intro'),
    mainBody: jsonb('main_body'),
    bestFor: jsonb('best_for'),
    ethics: jsonb('ethics'),
    keyFacts: jsonb('key_facts'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('articles_session_guest_idx').on(
      table.sessionId,
      table.isGuest,
    ),
  ],
);
