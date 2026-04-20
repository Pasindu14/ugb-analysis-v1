---
description: Project-wide prohibitions that always apply regardless of which file is being edited
---

# Never Do — HRIS Project Rules

These rules apply everywhere in the HRIS Next.js application.

- **Never hard-delete records** — soft-delete via `isActive = false` or `deletedAt` timestamp; never run a Drizzle `db.delete()` on business entities
- **Never send or accept companyId from the client** — multi-tenancy resolves server-side from the NextAuth JWT session inside `createAction`; all repository calls receive `companyId` from the session, never from user input
- **Never commit secrets, `.env` files, or connection strings** — use `.env.local` locally, environment variables in production
- **Never expose raw error messages or stack traces** — server actions return `{ success: false, error: string }` with user-safe messages; full errors are only logged server-side
- **Never use SQL Server or any non-PostgreSQL construct** — the database is PostgreSQL 16+; use only `pgEnum`, `uuid`, `timestamptz`, `jsonb`, and other PostgreSQL-native Drizzle types
- **Never call server actions directly from React components** — always go through a TanStack Query hook (`useMutation` / `useQuery`) in `features/{module}/hooks/`
- **Never use barrel exports for actions or schemas** — import directly from the specific file path to prevent client bundling of server code (e.g. `import { createEmployee } from '@/features/employee/actions/create-employee.action'`)
- **Never store server data in Zustand** — Zustand is for UI state only (dialog open/close, selected row ID, filter values); all server data lives in TanStack Query cache
- **Never write raw SQL strings** — all queries use Drizzle ORM query builder or `drizzle-orm/pg-core` helpers
- **Never skip the wrapper functions** — every action uses `createAction`, every service uses `executeService`, every repository function uses `executeQuery`; no unwrapped async functions that throw
- **Never store JWT tokens in insecure storage** — NextAuth manages session via secure HTTP-only cookies
