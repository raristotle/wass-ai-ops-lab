# WASS AI Ops Lab — Claude Guide

## Commands

Run all scripts from the **repo root** unless otherwise noted.

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint via Next.js config |
| `npm run typecheck` | `tsc --noEmit` (zero-emit type check) |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev --name <name>` | Create + apply a new migration |
| `npx prisma studio` | Open Prisma Studio GUI at :5555 |

## Stack

| Layer | Technology | Location |
|---|---|---|
| Framework | Next.js 15 (App Router, React 19) | `apps/web/` |
| Language | TypeScript (strict) | everywhere |
| Styling | Tailwind CSS 3 | `apps/web/tailwind.config.ts` |
| UI primitives | shadcn/ui | `components/ui/` |
| Charts | Recharts | `components/charts/` |
| Client state | Zustand | `lib/store.ts` |
| ORM | Prisma 6 + SQLite | `prisma/schema.prisma` |
| Validation | Zod | `lib/schemas.ts` |

## Path Aliases

All aliases resolve relative to the **repo root**, not `apps/web`.

```
@/components/*  →  components/*
@/lib/*         →  lib/*
@/features/*    →  features/*
@/data/*        →  data/*
```

Configured in `apps/web/tsconfig.json` (TS) and `apps/web/next.config.ts` (webpack).

## Coding Rules

### TypeScript
- Strict mode on. No `any`. No non-null assertions (`!`) without an inline comment explaining why.
- Derive TypeScript types from Zod schemas: `type Foo = z.infer<typeof FooSchema>`.
- Prefer `type` for plain data shapes; use `interface` only when declaration merging is needed.

### React / Next.js
- `"use client"` only on leaf components that need hooks or browser APIs (Recharts, Zustand).
- Server Components by default — don't add `"use client"` unless required.
- No prop drilling beyond 2 levels; use Zustand or React Context instead.

### Components
- shadcn/ui components live in `components/ui/` — extend via `className`, never edit source.
- Feature components go in `features/<domain>/`; shared presentational components in `components/`.

### Data & State
- **No real API calls, no secrets in code.** All data comes from `data/mock/`.
- One Zustand store: `lib/store.ts`. Keep it flat; no nested slice patterns.
- Validate external data at system boundaries with Zod schemas from `lib/schemas.ts`.

### Styling
- Tailwind utility classes only. No inline `style={{}}` except for animating numeric values.
- Dark mode via the `class` strategy — add `dark` to `<html>` to activate.

### Git
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Never commit `.env`, API keys, or any credentials.
- Keep PRs small and focused on a single concern.
