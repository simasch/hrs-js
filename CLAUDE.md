# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

T3 Stack application (Next.js 15 + tRPC 11 + Drizzle ORM + Tailwind CSS 4) using TypeScript. Database is SQLite via
libSQL. Created with `create-t3-app`.

## Commands

- `npm run dev` — Start dev server (uses Turbopack)
- `npm run build` — Production build
- `npm run check` — Lint + typecheck combined
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run typecheck` — TypeScript check only
- `npm run format:check` / `npm run format:write` — Prettier
- `npm run db:generate` — Generate Drizzle migrations
- `npm run db:migrate` — Run Drizzle migrations
- `npm run db:push` — Push schema directly to DB (skips migrations)
- `npm run db:studio` — Open Drizzle Studio GUI

No test framework is configured yet.

## Architecture

**Stack:** Next.js 15 App Router → tRPC 11 → Drizzle ORM → SQLite (libSQL)

**Key paths:**

- `src/app/` — Next.js App Router pages and layouts
- `src/app/_components/` — Route-private client components
- `src/server/api/routers/` — tRPC router definitions (add new routers here, register in `root.ts`)
- `src/server/api/trpc.ts` — tRPC initialization, context creation, `publicProcedure`
- `src/server/db/schema.ts` — Drizzle schema definitions
- `src/server/db/index.ts` — Database client (singleton in dev)
- `src/trpc/react.tsx` — Client-side tRPC hooks (`"use client"`)
- `src/trpc/server.ts` — Server-side tRPC caller (for RSCs)
- `src/env.js` — Type-safe env var validation (Zod)

**Path alias:** `~/` maps to `src/`

**Data flow patterns:**

- Server Components: `await api.post.getLatest()` (direct caller from `src/trpc/server.ts`)
- Client Components: `api.post.getLatest.useSuspenseQuery()` (React Query hooks from `src/trpc/react.tsx`)
- Prefetching in RSCs: `void api.post.getLatest.prefetch()` then `<HydrateClient>` wraps client components
- Cache invalidation: `api.useUtils()` to access React Query utils

**Database conventions:**

- All tables prefixed with `hrs_` (multi-project schema via `sqliteTableCreator`)
- Timestamps stored as integers (Unix epoch)
- `$onUpdate` for automatic `updatedAt` timestamps

**Environment:** Requires `DATABASE_URL` env var. Set `SKIP_ENV_VALIDATION=1` to bypass validation (useful for Docker
builds).

## Code Conventions

- React Server Components by default; add `"use client"` only when needed
- Zod schemas for all tRPC input validation
- ESLint enforces `import type` for type-only imports (inline style)
- Drizzle ESLint plugin enforces WHERE clauses on UPDATE/DELETE
- Unused variables must be prefixed with `_`
- Prettier sorts Tailwind classes automatically
