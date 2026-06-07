# AI Article

Monorepo for an AI-powered travel article generator. Upload rough travel notes (DOCX), and the AI produces a structured magazine-style article with real-time streaming.

## Apps

| App | Path | Description |
|-----|------|-------------|
| **Web** | `apps/web` | React + Vite frontend |
| **API** | `apps/api` | NestJS backend |

## Getting Started

```bash
pnpm install       # Install all dependencies
pnpm run dev       # Start both API + Web in parallel
```

## Scripts

```bash
pnpm run dev       # Dev servers (API + Web)
pnpm run build     # Build all apps
pnpm run lint      # Lint all apps
pnpm run db:push   # Push DB schema (API)
pnpm run db:studio # Open Drizzle Studio (API)
```

## Project Structure

```
ai-article/
├── apps/
│   ├── api/       # NestJS backend (Drizzle, Gemini, SSE)
│   └── web/       # React frontend (Shadcn, BlockNote, Firebase)
├── packages/
│   └── shared/    # Shared types & utilities
└── package.json   # Monorepo root (pnpm workspaces)
```
