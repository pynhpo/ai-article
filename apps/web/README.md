# AI Article — Web

Frontend for the AI-powered travel article generator. Upload a DOCX file, and the AI analyzes and produces a structured article (intro, main body, best for, ethics, key facts).

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** + **Shadcn UI**
- **BlockNote** — Block-based rich text editor
- **Firebase** — Authentication (Google sign-in)
- **Mammoth** — DOCX parsing & preview
- **Axios** — API client

## Project Structure

```
src/
├── components/       # Shared UI components (Shadcn, article-editor, layout)
├── hooks/            # Custom hooks (auth, docx upload, article generation)
├── pages/
│   ├── Home/         # Main page: upload, preview, article result, history
│   │   └── components/   # UploadDropzone, ArticleResultView, ArticleHistory, ...
│   ├── Account/      # Account page
│   └── ArticleEditor.tsx  # Editor page (BlockNote)
├── utils/            # API client, article-to-blocks converter
├── App.tsx           # Routing
└── index.css         # Tailwind config + theme
```

## Scripts

```bash
pnpm dev        # Dev server (Vite)
pnpm build      # Production build
pnpm lint       # ESLint
pnpm preview    # Preview production build
```

> **Note**: Run `pnpm run dev` from the monorepo root to start both API and Web simultaneously.
