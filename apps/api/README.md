# AI Article — API

Backend for the AI-powered travel article generator. Handles authentication, AI article generation via LLM streaming (SSE), and article CRUD.

## Tech Stack

- **NestJS** + **TypeScript**
- **Drizzle ORM** + **PostgreSQL**
- **BytePlus Seed 2.0** — LLM for article generation
- **Firebase Admin** — Token verification (Google sign-in)
- **SSE** — Real-time streaming of generated sections

## Modules

```
src/modules/
├── ai/           # LLM service & controller (SSE streaming)
├── article/      # Article CRUD (staging + saved articles)
├── auth/         # Session management, Firebase token verification
├── database/     # Drizzle schema, DB connection
└── integration/  # External service integrations (LLM client, types)
```

## Scripts

```bash
pnpm dev          # Dev server (watch mode)
pnpm build        # Production build
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
pnpm db:generate  # Generate migrations
pnpm lint         # ESLint
```
