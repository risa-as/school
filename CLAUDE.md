# School ERP — Multi-Tenant SaaS (Iraq & MENA)

Arabic-first (RTL) school ERP SaaS. Targets: best-in-class UX for low-tech users, fast on weak networks (3G), strict tenant isolation.

## Stack
- Monorepo: pnpm workspaces (`apps/*`, `packages/*`)
- `apps/api` — NestJS 11 + Prisma + PostgreSQL 16 (shared DB, `tenant_id` + RLS) + Redis/BullMQ
- `apps/web` — Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui, RTL-first
- `docs/` — ARCHITECTURE.md (source of truth), DESIGN_SYSTEM.md (visual source of truth), PROGRESS.md (shared log)

## Conventions
- TypeScript strict everywhere. English identifiers; ALL user-facing strings via i18n dictionaries. THREE first-class locales with runtime switching: `ar` Arabic (default, RTL), `ckb` Central Kurdish/Sorani (RTL, Arabic script), `en` English (LTR). `<html dir>` and `lang` derive from the active locale — never hardcode direction or UI text in components.
- Every tenant-scoped table has `tenantId` (uuid). Never query tenant data without tenant scope.
- API: REST under `/api/v1`, kebab-case routes, DTOs validated with class-validator.
- UI: RTL by default — use CSS logical properties only (`ms-`/`me-`, `start`/`end`), never `left`/`right`.
- Money: IQD stored as `BigInt` (no decimals). Dates stored UTC; displayed in Asia/Baghdad.
- Package names: `@school/api`, `@school/web`, `@school/ui`.

## Coordination rules (ALL agents MUST follow)
1. Before writing code, read `docs/ARCHITECTURE.md` and `docs/DESIGN_SYSTEM.md` (if present).
2. Work ONLY inside your assigned directory; if you must touch a shared file, note it in PROGRESS.md.
3. When finished, APPEND an entry to `docs/PROGRESS.md`: date, agent name, what was built, key decisions, open blockers.
4. Never `git commit` — leave changes in the working tree for the coordinator.
5. Verify your work compiles (`pnpm build` in your app) before reporting done.
