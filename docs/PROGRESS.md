# Progress Log

> Append-only. Every agent adds an entry when finishing a work package.
> Format: `## [date] — [agent]` then: What was built / Key decisions / Blockers.

## 2026-07-02 — coordinator
- Initialized monorepo (pnpm workspaces), git repo, CLAUDE.md conventions, ARCHITECTURE.md.
- Spawned agents: ui-designer (design system + mockup), backend-dev (apps/api scaffold), frontend-dev (apps/web scaffold).

## 2026-07-02 — ui-designer
**What was built**
- `docs/DESIGN_SYSTEM.md` — visual source of truth: brand direction, 8 research
  references with what to borrow from each, full light/dark color system (neutrals,
  primary, semantic, chart palette), localization/typography for 3 locales
  (`ar`/`ckb`/`en`), LTR-mode flip rules, spacing/radius/shadow tokens, a ready-to-paste
  Tailwind v4 + shadcn/ui `:root`/`.dark` CSS-variable block, and RTL layout +
  component-inventory rules (sidebar, topbar, tables, forms, empty states, mobile).
- `docs/design/mockup-dashboard.html` — self-contained static mockup (inline CSS,
  `dir="rtl" lang="ar"`, real-looking Arabic content for مدرسة النور الأهلية):
  right-side sidebar nav, topbar with search + dark-mode toggle + language switcher
  (globe → العربية/کوردی/English via native `<details>`, no JS dependency) +
  notifications, 4 KPI stat cards, recent-activity list, students table.

**Key decisions**
- Mid-task requirement change added `ckb` (Central Kurdish/Sorani) as a third
  locale. Rejected IBM Plex Sans Arabic (open upstream bug on Central Kurdish
  rendering — `google/fonts#7089`, `IBM/plex#597`) and Cairo/Tajawal/Almarai
  (Kurdish support undocumented/absent). Chose **Noto Sans Arabic** (full Arabic
  Unicode block coverage, where all Sorani-specific letters already live) for
  `ar`/`ckb`, **Vazirmatn** as fallback (explicit Kurdish support since v27), and
  **Inter** for `en`/Latin.
- Primary brand color is a teal (`#0D6E7D` light / `#14808F` dark) rather than the
  generic SaaS azure/indigo — deliberately distinct, still calm/trustworthy.
  Neutral scale is Tailwind's "Stone" (warm gray, pre-vetted contrast).
- **Every color pairing is WCAG AA-verified against the surface it actually renders
  on** (not a generic white/black check) using the `dataviz` skill's contrast
  validator — this caught a real bug: `stone-500` muted text is AA-safe on the base
  background (4.5–4.8:1) but drops to 4.40:1 (below AA) on a muted *fill*; the doc
  and mockup now use `stone-600` on any muted/tinted background instead.
- KPI cards follow the `dataviz` skill's stat-tile contract and color discipline:
  cards stay neutral, color lives only on the delta (and only where direction has a
  value judgment — student count and unread-message count are neutral, attendance
  and fees-collected deltas are green/red).
- Chart categorical palette re-validated against this system's actual card
  surfaces (`#ffffff` light / `#1c1917` dark), not the skill's generic defaults —
  passes both, with a documented relief obligation (direct labels / table view) for
  3 light-mode slots under 3:1 and for 4+ series in dark mode (CVD floor band).
- Caught and fixed a logical-properties bug during self-review: `inset-inline-end`
  is the **left** edge in RTL, not the right — the sidebar must sit at
  `inset-inline-start` (first DOM child in a `flex-direction: row` container) to
  land on the right in `ar`/`ckb` and auto-mirror to the left under `dir="ltr"`.
- Working platform brand name "ديوان" (Diwan) reserved for login/marketing/
  super-admin chrome only — inside a school's own workspace, the school's own
  name/identity leads (multi-tenant white-label).

**Blockers**
- None. `apps/web` does not exist yet — `docs/DESIGN_SYSTEM.md` §6.1's CSS block is
  ready to paste into `globals.css` once frontend-dev scaffolds the Next.js app.

## 2026-07-02 — backend-dev

**What was built**
- Hand-scaffolded `apps/api` as `@school/api` (NestJS 11, TS strict, no nested git
  init — chose hand-scaffold over `nest new` for full control over tsconfig/build
  and to avoid its interactive/git-init behavior inside a monorepo). Build uses
  plain `tsc -p tsconfig.build.json` (no `@nestjs/cli` dependency); `pnpm build`
  and `pnpm test` both green.
- `prisma/schema.prisma`: all Phase-1 entities from `docs/ARCHITECTURE.md`
  (Organization, School, User, Membership, Role, Permission, RolePermission,
  AcademicYear, GradeLevel, Section, Subject, Student, Guardian, StudentGuardian,
  Enrollment) plus `RefreshToken`. No attendance/grades/fees models. Every
  tenant-scoped model carries `tenantId` + `@relation` to `School` +
  `@@index([tenantId])`. Added `User.locale String @default("ar")` (`"ar"|"ckb"|"en"`)
  per the mid-task requirement update, threaded through `UpdateUserDto` and the
  `/users/me` response.
- **Multi-tenant core** (the critical piece):
  - `common/tenant-context/tenant-context.ts` — `TenantContext` static wrapper over
    a single process-wide `AsyncLocalStorage`; `TenantContextMiddleware` resolves
    `X-Tenant-Id` and binds it for the request's async call chain (registered
    globally in `AppModule.configure()`).
  - `prisma/tenant-scoping.ts` — **pure, framework-agnostic** core: `applyTenantScope()`
    mutates Prisma query args per-operation (create/createMany/upsert/update/
    delete/find*/count/aggregate/groupBy), forcibly overriding any client-supplied
    `tenantId` with the context value (defends against both bugs and malicious
    input), and throws `TenantContextMissingError` for any tenant-scoped model
    touched with no bound tenant. Also recursively walks nested `create`/
    `createMany`/`connectOrCreate` payloads (via a DMMF-derived relation map) so
    e.g. `student.create({ data: { enrollments: { create: {...} } } })` stamps the
    nested `Enrollment` too — Prisma's `$allOperations` hook only sees the
    top-level call, not nested relation writes, so without this a nested tenant-
    scoped create would hit a NOT-NULL constraint instead of being silently wrong
    (fails closed either way, but the recursion makes the common nested-write case
    actually work rather than error).
  - `prisma/tenant-scoping.extension.ts` + `prisma/prisma.service.ts` wire that
    pure logic into a real `$extends()` Prisma Client, exposed as
    `PrismaService.client` (kept as a property, not a subclass — `$extends()`
    returns a type a `class X extends PrismaClient` cannot faithfully re-expose
    under strict TS).
  - `prisma/tenant-scoped-models.ts` is an explicit allowlist (not inferred) of
    which Prisma models are tenant-scoped, so adding a new model to the schema
    without deciding its tenancy is a compile-time-visible gap, not silent.
- **Auth**: phone-or-email + password (argon2), hand-rolled `JwtAuthGuard` (no
  `@nestjs/passport` — smaller surface). Access JWT 15m carries `permissions[]`
  baked in at login from `Role → RolePermission → Permission` (avoids a DB round
  trip per request). Refresh tokens are **opaque random strings**, SHA-256-hashed
  at rest in `RefreshToken.tokenHash` (never store the raw token), 30-day
  expiry, single-use rotation (old token revoked + `replacedByTokenHash` chained
  when a new one is issued). Login requires `X-Tenant-Id` like any other
  request — no special-casing, since `Membership` is tenant-scoped.
- `rbac/permissions.catalog.ts` (global, Arabic-labeled catalog covering
  students/guardians/academics/attendance/grades/fees/users/school/reports) and
  `rbac/default-roles.ts` (owner/principal/registrar/accountant/teacher/parent/
  student with sensible per-role grants). `rbac/seed-default-roles.ts` is invoked
  automatically by `TenantsService.createSchool()` right after the `School` row
  is created (entering `TenantContext.run({ tenantId: school.id }, ...)` manually,
  since bootstrapping a brand-new tenant is the one legitimate case of entering
  tenant context outside the middleware). `prisma/seed.ts` seeds only the global
  permission catalog and is **not** wired into any build/start hook — run
  manually with `pnpm seed`.
- CRUD modules with class-validator DTOs: `tenants` (platform-level
  `POST /tenants` creates Organization-optional + School + owner User + owner
  Membership in one call), `users` + `memberships`, `students` (list with
  pagination/search, create/update/remove), `academics` (academic-years,
  grade-levels, sections, subjects — full CRUD each). Global prefix `/api/v1`,
  kebab-case routes. `AllExceptionsFilter` normalizes every thrown error
  (`HttpException`, `TenantContextMissingError`, anything else) into
  `{ statusCode, message, errors[] }` with Arabic messages.
- `docker-compose.yml` at repo root (`postgres:16-alpine` + `redis:7-alpine`,
  named volumes, healthchecks, ports 5432/6379) and `apps/api/.env.example`.
- Jest unit tests (62 tests, all passing) covering the tenant-scoping
  mechanism and the auth/DI wiring around it: `tenant-context.spec.ts` (incl. a
  concurrency test proving two simulated concurrent requests never see each
  other's `tenantId` via `AsyncLocalStorage`), `tenant-scoped-models.spec.ts`,
  `relation-map.spec.ts`, `tenant-scoping.spec.ts` (missing-context throws for
  every operation type, where-injection/override, create/createMany/upsert
  stamping, `update`/`updateMany` stripping an attacker-supplied `tenantId`
  from `data`, and nested create/createMany/connectOrCreate recursion incl. 2+
  levels deep), `jwt-auth.guard.spec.ts` (token/tenant mismatch rejection), and
  `app.smoke.spec.ts` — a full `Test.createTestingModule({ imports: [AppModule]
  }).../ app.init()` bootstrap with only `PrismaService` stubbed, no live DB,
  that exercises real DI resolution and middleware registration end to end.

**Hardening pass (same session, pre-existing-code review before declaring done)**
Self-review plus a second pass surfaced three real issues, all fixed with a
regression test added for each — noted explicitly since they were not caught
by `tsc` or the initial pure-function test suite alone:
1. **Cross-tenant auth bypass (was BLOCKING):** `JwtAuthGuard` decoded and
   trusted the access token's `tenantId` claim but never compared it to the
   request's actual `X-Tenant-Id`-derived `TenantContext.tenantId`. A token
   issued for school A, replayed with `X-Tenant-Id: B`, would authorize
   against B with A's baked-in permissions — the Prisma extension would then
   faithfully (and wrongly) scope every query to B. Fixed: the guard now
   rejects (401) whenever `payload.tenantId !== TenantContext.tenantId`.
2. **`update`/`updateMany` could reassign a row's `tenantId`:** the scoping
   extension forced `where.tenantId` but left `data` untouched for update
   operations, so `data: { tenantId: 'other-school' }` would move a row
   between tenants. Fixed: `tenantId` is now stripped from `data` on
   `update`/`updateMany`/`updateManyAndReturn`, matching the stripping
   already done for upsert's `update` branch.
3. **DI/bootstrap bug the type checker couldn't see:** `AuthModule` exported
   `JwtAuthGuard`/`PermissionsGuard` but neither the module nor its
   `JwtModule.register({})` import were global, so `app.init()` (added as
   `app.smoke.spec.ts` specifically to catch this class of bug) failed with
   "Nest can't resolve dependencies of JwtAuthGuard... JwtService... available
   in the UsersModule module" — a real bootstrap failure `tsc`/pure-function
   tests are structurally unable to detect. Fixed by making `AuthModule`
   `@Global()` and `JwtModule.register({ global: true })`. Also caught along
   the way: a `connectOrCreate` nested-write bug where the tenant-stamping
   logic unconditionally coerced the value to an array, corrupting the
   single-object shape Prisma expects for to-one relations — fixed to
   preserve the original array/object shape.

**Key decisions**
- Tenant scoping is enforced in exactly one place — the Prisma extension — not
  scattered across services. Services still spell out `tenantId:
  TenantContext.getTenantIdOrThrow()` in `create()` calls; this is *not* required
  for correctness (the extension overwrites it unconditionally) but is required
  to satisfy Prisma's generated TypeScript input types, which have no way to
  know the extension injects the field at runtime — so it doubles as
  self-documentation and a second independent check.
- The Prisma extension test suite is built entirely on pure functions with a
  hand-written DMMF fixture (`relation-map.spec.ts`, `tenant-scoping.spec.ts`),
  not a real `PrismaClient` — no DB, no mocking Prisma internals. This is also
  why `prisma generate` had to run before `pnpm build`/`pnpm test` (it does not
  require a live DB connection, only schema → client codegen).
- `TenantContextMiddleware` is deliberately permissive (never rejects a request
  for a missing header) — enforcement is entirely the Prisma extension's job.
  This keeps platform routes (`POST /tenants`) simple with no route-exclusion
  list to maintain, and keeps the guarantee airtight even for code paths that
  don't go through HTTP at all (e.g. the seed/bootstrap flow, which enters
  `TenantContext.run()` directly).
- A real bug was caught by the test suite before it shipped: the first version
  of the nested `connectOrCreate` handling unconditionally coerced the value to
  an array, corrupting the single-object shape Prisma expects for to-one
  relations. Fixed in `tenant-scoping.ts` to preserve the original array/object
  shape; a regression test for the array form was added alongside the original.
- Known, documented limitation: the tenant-scoping extension only intercepts
  Prisma Client calls (`$queryRaw`/`$executeRaw` bypass it entirely, by design —
  raw SQL should not be used against tenant-scoped tables without hand-written
  `WHERE tenant_id = ...`). No raw queries exist anywhere in the current
  codebase. Postgres Row-Level Security (mentioned as a later hardening layer in
  `docs/ARCHITECTURE.md`) is not implemented yet — app-level scoping only, as
  specified for this phase.

**Blockers**
- None. No live DB was started or migrated (per instructions); `prisma generate`
  ran successfully against the schema. `pnpm prisma migrate dev` still needs to
  be run once a developer points `DATABASE_URL` at a real Postgres (e.g. via the
  new root `docker-compose.yml`) before the API can actually serve requests.

## 2026-07-02 — frontend-dev

**What was built**
- Scaffolded `apps/web` as `@school/web`: Next.js 15 (App Router) + TypeScript
  strict + Tailwind CSS v4 + shadcn/ui-style primitives, integrated into the pnpm
  workspace (no nested lockfile/git; `create-next-app`'s Next 16 default was pinned
  back to Next 15.5.x per the stack spec). `pnpm build` green (all routes ~102 kB
  first-load JS, server-rendered — fits the 3G budget; the only client components
  are the sidebar collapse, language switcher, and two dropdowns).
- **Design tokens**: `src/app/globals.css` carries `docs/DESIGN_SYSTEM.md` §6.1
  verbatim (`:root`/`.dark` hex tokens, teal `#0D6E7D`/`#14808F` primary, Stone
  neutrals, semantic + soft-tint pairs, 8-slot chart palette, sidebar tokens,
  elevation shadows, `--radius: 0.75rem`) exposed via `@theme inline`. Also
  implements §3.2 Arabic-tuned line-heights (1.75 ar/ckb, 1.55 en), the §3.3
  Western-digits rule (`font-variant-numeric: normal` on ar/ckb) and `bdi`
  isolation for number+currency groups inside RTL text.
- **i18n foundation** (`src/i18n/`): one typed `Dictionary` interface
  (`types.ts`) implemented in full by `ar.ts` (default), `ckb.ts`, `en.ts`;
  `locales.ts` (locale → `lang`/`dir`/native name); `index.ts` (server-only
  `getLocale()` from the `locale` cookie, `getDictionary()`, and a typed
  dot-path `t()` helper). `<html lang dir>` derives from the cookie at the root
  layout — nothing hardcodes direction. Runtime switching works end-to-end:
  topbar globe menu → `setLocaleAction` (cookie) → `router.refresh()`; verified
  ar→rtl, ckb→rtl, en→ltr against the running server.
- **Fonts** per DESIGN_SYSTEM §3.1: Noto Sans Arabic (ar/ckb, covers Sorani
  glyphs) + Inter (Latin) via `next/font/google`; `html[lang="en"]` swaps to an
  Inter-first stack in CSS only.
- **Routes**: `(auth)/login` (centered card, school-logo placeholder,
  phone-or-email + password, labels above fields per §7.4, posts to a no-op
  server-action stub); `(dashboard)/` shell — sidebar as FIRST flex child so it
  sits at inline-start (right edge in ar/ckb, left in en, zero direction code),
  collapsible to an icon rail, 7 nav items with lucide icons; topbar (school
  name, search placeholder, language switcher, notifications bell with badge
  dot, user menu). `/dashboard`: 4 KPI stat tiles per §5.5 + dataviz stat-tile
  contract (neutral cards; green delta only on attendance/fees where direction
  is a value judgment; info tint on unread-messages chip; inline SVG sparklines,
  no chart lib) + recent-activity card. `/students`: table with 10 realistic
  Arabic mock rows (name+registry no, section, guardian phone end-aligned
  `tabular-nums` in `<bdi dir="ltr">`, status as icon+label soft pills per
  §7.3), search input + "إضافة طالب" button (both visual stubs). Root `/`
  redirects to `/dashboard`.
- shadcn/ui primitives hand-written for Tailwind v4 (button, input, card,
  badge incl. success/warning/info soft variants, table with `text-start`
  headers, dropdown-menu on `@radix-ui/react-dropdown-menu`); `components.json`
  configured so future `shadcn add` calls land in the same aliases.

**Key decisions**
- The `shadcn init` CLI hung (slow registry) and its current version no longer
  matches the docs' flags — primitives were written by hand instead; identical
  contract, fewer dependencies, and every physical `left/right`/`text-left`
  class in upstream shadcn replaced with logical equivalents at the source.
- Zero hardcoded UI strings (chrome comes from the three dictionaries; the
  typed `DictionaryPath` union makes a missing key a compile error). Mock
  entity data (school/student/guardian names, activity feed) intentionally
  lives in `src/lib/mock-data.ts` as data-not-chrome — it stands in for API
  responses and stays Arabic under en/ckb, as real tenant data would.
- KPI keys follow DESIGN_SYSTEM §5.5's four tiles (students / attendance today /
  fees collected / unread messages) rather than the earlier draft list, per the
  coordinator's instruction to build the tiles to §5.5.
- Verified RTL discipline mechanically: repo-wide grep for `ml-|mr-|pl-|pr-|
  left-|right-|text-left|text-right|border-l|border-r|rounded-l|rounded-r`
  returns zero matches in `src/`.
- Shared files touched (allowed/required): root `pnpm-workspace.yaml` gained
  `onlyBuiltDependencies`/`allowBuilds` entries (written by `pnpm
  approve-builds --all`) so postinstall scripts (`sharp`, `@tailwindcss/oxide`,
  prisma, argon2) run non-interactively; `docs/PROGRESS.md` (this entry).

**Blockers**
- None for the scaffold. Open integration points for later work packages:
  auth/login posts to a stub; search/add-student/notifications are visual
  stubs; nav items without pages (`الشعب والصفوف`, `الحضور`, `الدرجات`,
  `الأقساط`, `الإعدادات`) link to `#`; no mobile off-canvas drawer yet
  (sidebar hides < 768px per §7.6 — drawer is a follow-up); dark mode tokens
  are in place but there is no theme toggle yet.

## 2026-07-02 — qa-reviewer (api)

Report-only review of `apps/api` (NestJS 11 + Prisma, `@school/api`) per
CLAUDE.md / docs/ARCHITECTURE.md, verifying backend-dev's 2026-07-02 claims
against the actual code, not on faith. `apps/web` untouched (out of scope).

**Build/test verification (actual output)**
- `pnpm build` (`tsc -p tsconfig.build.json`) — PASS, exit 0, zero errors.
- `pnpm test` (jest) — PASS: 6 suites, 62 tests, all green. Matches the
  backend-dev PROGRESS claim exactly (`relation-map.spec.ts`,
  `tenant-scoping.spec.ts`, `tenant-context.spec.ts`,
  `tenant-scoped-models.spec.ts`, `jwt-auth.guard.spec.ts`,
  `app.smoke.spec.ts`).
- Confirmed generated Prisma client is present (pnpm store location:
  `node_modules/.pnpm/@prisma+client@6.19.3.../node_modules/.prisma/client`),
  so build/test green is real, not a stale-artifact false pass.
**Findings (ranked)**

1. CRITICAL — Cross-tenant foreign-key references are never validated on
   create/update for `Section` and `Subject`.
   `apps/api/src/academics/sections/sections.service.ts:24-28` (`create`) and
   `:32` (`update`); `apps/api/src/academics/subjects/subjects.service.ts:24-28`
   (`create`) and `:32` (`update`). Both spread the raw DTO (`academicYearId`,
   `gradeLevelId` — plain scalar FK strings) straight into `data`. The Prisma
   tenant-scoping extension (`tenant-scoping.ts`) only stamps/validates the
   own tenantId of the row being written and walks relation-object fields
   (`create`/`createMany`/`connectOrCreate`) via the DMMF relation map — it
   never inspects plain scalar FK columns. Failure scenario: an authenticated
   registrar/principal in School A calls `POST /api/v1/sections` with
   `academicYearId`/`gradeLevelId` UUIDs belonging to School B (guessed,
   leaked, or brute-forced); the row is created in School A with a live FK
   into School B academic structure — a Postgres-valid but tenant-crossing
   reference, and a cross-tenant existence oracle even before any `include`
   is added downstream. Not caught by the existing test suite because it is
   a service-layer gap, not an extension-layer one. Same pattern will bite
   `Enrollment` (studentId/academicYearId/gradeLevelId/sectionId) and
   `StudentGuardian` (studentId/guardianId) the moment those modules are
   built.
2. HIGH — `POST /tenants` (school + owner signup) has zero auth guard and is
   reachable by anyone. `apps/api/src/tenants/tenants.controller.ts:12-21`.
   Candidly documented in-code as a known Phase-1 gap ("real deployments will
   front this with a separate platform-admin auth mechanism"), so not a
   false claim — but it is a live, unauthenticated tenant/user-creation
   endpoint today. Failure scenario: anyone can script unlimited
   `POST /api/v1/tenants` calls to create schools plus owner accounts
   (resource exhaustion / abuse), with no rate limiting or captcha.

3. MEDIUM — Refresh-token rotation has no reuse/theft detection.
   `apps/api/src/auth/auth.service.ts:80-104`. A revoked (already-rotated)
   token is correctly rejected (`existing.revokedAt` check), but reuse of a
   revoked token does not revoke the rest of that token descendant chain or
   flag the account. Failure scenario: attacker steals refresh token RT1 and
   races the legitimate user to redeem it first; attacker walks away with a
   valid RT2 chain, the legitimate user later RT1 use fails silently, and no
   alarm/session-wide revocation happens.

4. MEDIUM — User-facing error strings are hardcoded Arabic prose baked into
   exceptions across every service, with no machine-readable error code for
   the 3-locale (ar/ckb/en) frontend to translate.
   Examples: `students.service.ts:39,49`; `sections.service.ts:20`;
   `subjects.service.ts:20`; `auth.service.ts:39,44,52,86,94`;
   `tenants.service.ts:23`; `memberships.service.ts:38,64,73,76,79`;
   surfaced verbatim by `all-exceptions.filter.ts:54,59-63`. CLAUDE.md
   requires ALL user-facing strings via i18n dictionaries; ARCHITECTURE.md
   itself calls for Arabic-friendly error codes, i.e. codes, not prose.
   Failure scenario: an en/ckb-locale user gets Arabic error text with no
   code the web app can map through its dictionaries.
5. LOW — `app.enableCors()` with no options allows any origin.
   `apps/api/src/main.ts:11`. Fine for local dev, unsafe if this config ships
   unchanged to a shared/staging environment.

6. LOW — `tsconfig.json:21` sets `strictPropertyInitialization: false`,
   partially relaxing "TypeScript strict everywhere" (the rest of the strict
   family is on).

7. LOW — Account-existence oracle via phone/email lookup when attaching an
   existing user to a new tenant. `memberships.service.ts:87`,
   `tenants.service.ts:65`. A registrar in School A can learn whether a given
   phone/email is already a platform user (silently reused) vs new (created)
   — minor cross-tenant information leak, not a data leak.

8. INFORMATIONAL — `TenantContextMiddleware` never validates that
   `X-Tenant-Id` corresponds to a real `School` row (by design — enforcement
   is delegated entirely to the Prisma extension). Confirmed this fails
   closed: reads return empty sets, writes hit FK constraint errors; not a
   bypass, just worth knowing for error-message clarity work later.
**Verified sound (with evidence, not just claims)**
- `TENANT_SCOPED_MODELS` allowlist (`tenant-scoped-models.ts`) matches
  `prisma/schema.prisma` exactly — all 11 tenant-scoped models present, no
  gaps, no extras.
- `applyTenantScope` (`tenant-scoping.ts`) forces `where.tenantId`/
  `data.tenantId` on every CRUD op incl. nested `create`/`createMany`/
  `connectOrCreate` (via DMMF relation map), and strips attacker-supplied
  `tenantId` from `update`/`updateMany`/`updateManyAndReturn`/upsert-update
  `data` — read the implementation and the 62 passing tests; behavior
  matches the PROGRESS description.
- `JwtAuthGuard` genuinely rejects a token whose `payload.tenantId` differs
  from the `X-Tenant-Id`-derived `TenantContext.tenantId`
  (`jwt-auth.guard.ts:51-53`), including the no-X-Tenant-Id-at-all case;
  confirmed both by reading the code and by the 5 passing cases in
  `jwt-auth.guard.spec.ts`.
- No raw-SQL client methods (query/execute raw variants) used anywhere in
  `src/` (grep-verified) — no raw-SQL bypass path exists today.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,
  transform: true })` in `main.ts:12-19`; pagination bounded to
  `pageSize <= 100` (`pagination-query.dto.ts:15`).
- `argon2` used for all password hashing/verification (login, membership
  invite, tenant-owner creation); JWT secret is read exclusively from
  `ConfigService`/env (`JWT_ACCESS_SECRET`) with no hardcoded fallback found
  anywhere in `src/`.
- Spot-checked mutating endpoints all carry both guards plus `@Permissions`:
  `students.controller.ts`, academic-years/grade-levels/sections/subjects
  controllers (academics), `memberships.controller.ts` — every
  POST/PATCH/DELETE route is covered; `users.controller.ts` (`/me`
  self-service) correctly uses `JwtAuthGuard` only, no `@Permissions` needed.
- Login/refresh correctly rely on `Membership` being tenant-scoped (no
  manual tenant check needed) — verified the extension really does inject
  `tenantId` into those `findFirst` calls.

**Not verified / out of scope**
- No live Postgres was started; no request was actually sent over HTTP
  against a running server (per instructions — build and unit tests only, no
  DB). The cross-tenant FK finding (#1) is a static-code-path finding, not
  confirmed against a live DB with two real tenants; recommend an
  integration test as the fix-verification step.
- `apps/web` not reviewed (explicitly out of scope for this pass).

## 2026-07-02 -- qa-reviewer (web)

Report-only review of `apps/web` (Next.js 15 App Router + Tailwind v4,
`@school/web`) per CLAUDE.md / docs/ARCHITECTURE.md / docs/DESIGN_SYSTEM.md,
verifying frontend-dev's 2026-07-02 claims against the actual code and a real
`pnpm build`/`pnpm lint`/`tsc --noEmit` run, not on faith. `apps/api` untouched
(out of scope, covered by qa-reviewer (api) above).

**Build/verification (actual output)**
- `pnpm build` -- PASS. Compiled successfully, type-check clean, all 4 routes
  (`/`, `/dashboard`, `/login`, `/students`) render dynamically (server-rendered
  on demand, ~102 kB first-load JS shared) -- dynamic rather than static because
  every page reads the `locale` cookie; matches frontend-dev's ~102 kB claim.
- `pnpm lint` (eslint) -- PASS, zero output.
- `npx tsc --noEmit` -- PASS, zero output (strict mode per `tsconfig.json:11`).
- Repo-wide grep for physical-direction utilities/CSS
  (`ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|border-l-|border-r-|
  rounded-l-|rounded-r-|margin-left|padding-right|...`) plus a broader second
  pass (`float-|origin-left|origin-right|clear-*|scroll-m*|scroll-p*`) -- zero
  matches in `src/`. Confirms frontend-dev's RTL-discipline claim.

**Findings (ranked)**

1. MEDIUM -- No auth guard on the dashboard route group. No `middleware.ts`
   exists anywhere in `apps/web` (Glob for `**/middleware.ts` returned
   nothing); `apps/web/src/app/page.tsx:4` unconditionally
   `redirect("/dashboard")`; `apps/web/src/actions/auth.ts:8-11`
   (`loginAction`) is an intentional no-op stub that never sets a session
   cookie. Failure scenario: today, hitting `/` or `/dashboard` directly
   renders the full dashboard shell with no login check at all -- expected at
   this scaffold stage (disclosed in frontend-dev's own blockers list as "auth
   posts to a stub"), but flagged per the standing checklist item and as a
   must-fix-before-wiring-real-auth item, not a new surprise.

2. MEDIUM -- DESIGN_SYSTEM section 3.2's per-size Arabic/Latin line-height table is
   not implemented; only a blanket body-level rule exists.
   `apps/web/src/app/globals.css:212-220` sets `body { line-height: 1.75 }`
   and `html[lang="en"] body { line-height: 1.55 }`, but section 3.2 specifies a
   per-text-size table (e.g. `--text-xl`: 1.6 ar/ckb vs 1.4 en; `--text-2xl`:
   1.55 vs 1.35) via a documented `--lh-scale` mechanism -- none of that was
   encoded as CSS. Tailwind v4's default `text-xl`/`text-2xl`/etc. utilities
   (used throughout -- e.g. `text-xl font-bold` dashboard heading in
   `apps/web/src/app/(dashboard)/dashboard/page.tsx:22`, `text-2xl` KPI value
   in `apps/web/src/components/dashboard/kpi-card.tsx:52`) each carry their
   own baked-in line-height that overrides the inherited body value (Tailwind
   sets font-size and line-height together per utility). Failure scenario:
   any heading/label/stat-value using a Tailwind text-size class silently
   reverts to a tight, Latin-tuned line-height regardless of locale -- the
   exact "reusing a Latin line-height for Arabic" mistake section 3.2 explicitly
   warns is "the single most common Arabic-UI mistake." Frontend-dev's
   PROGRESS claim ("implements section 3.2 Arabic-tuned line-heights") is only
   partially true -- verified true for plain body copy, not verified/false for
   any sized text.

3. MEDIUM -- Mobile navigation is currently unreachable. `Sidebar` is
   `hidden ... md:flex` (`apps/web/src/components/layout/sidebar.tsx:59`), and
   `Topbar` (`apps/web/src/components/layout/topbar.tsx`) has no hamburger
   trigger anywhere. Below the `md` (768px) breakpoint there is no way to
   reach `/students` or any other nav item except typing the URL directly.
   This is explicitly disclosed as a known blocker in frontend-dev's own
   PROGRESS entry ("no mobile off-canvas drawer yet ... drawer is a
   follow-up"), so not a hidden gap, but the design doc frames "weak-network,
   small-screen parent users" as "a primary persona, not an edge case"
   (section 7.6). Upgraded from the disclosed-blocker default of LOW to
   MEDIUM because there is currently *zero* way to navigate below 768px, not
   a degraded one, against an explicitly named primary persona.

4. LOW -- DESIGN_SYSTEM section 3.3's second numerals requirement (format all dynamic
   numbers via `Intl.NumberFormat("en-u-nu-latn", ...)` in JS) has no call site
   anywhere in the codebase (grep for `Intl.NumberFormat` -- zero matches).
   Only the CSS half (`font-variant-numeric: normal`,
   `apps/web/src/app/globals.css:224-227`) is implemented. Currently masked
   because every numeric value in the app is a pre-formatted mock string
   (`apps/web/src/lib/mock-data.ts`) -- UNVERIFIED as a live bug since nothing
   dynamic exists yet to break, but it's an open gap the next real-data wiring
   pass must not forget, since it's easy to silently regress once numbers
   come from an API/user locale instead of a hardcoded string.

5. LOW / informational -- Sidebar "collapsible to icon-only rail at <1280px"
   (DESIGN_SYSTEM section 7.2) is implemented as a manual user-toggle (`useState` in
   `apps/web/src/components/layout/sidebar.tsx:53`), not an automatic
   breakpoint-triggered collapse at 1280px. Minor spec-interpretation gap, not
   a functional bug -- flagging for the record only.

**Verified sound (with evidence, not just claims)**
- RTL discipline: zero physical-direction utility/CSS matches in `src/` across
  two independent grep passes (see above); sidebar positioned via first-flex-
  child order + logical `border-e` (`sidebar.tsx:57-61`), consistent with the
  ui-designer's corrected "first DOM child, not `inset-inline-end`" note in
  their own PROGRESS entry. All UI primitives (`button.tsx`, `input.tsx`,
  `card.tsx`, `badge.tsx`, `table.tsx`, `dropdown-menu.tsx`) use only logical
  Tailwind utilities (`ms-`, `me-`, `ps-`, `start-`, `text-start`, `border-e`).
- i18n completeness: `src/i18n/types.ts` defines one `Dictionary` interface;
  `ar.ts`, `ckb.ts`, `en.ts` are each declared `const x: Dictionary = {...}`,
  so TypeScript structurally enforces full key parity across all three --
  confirmed green by `tsc --noEmit`, not just by inspection. Read all three
  files end-to-end; every key present in all three, no placeholder/TODO text.
- No hardcoded user-facing strings in components/pages: grep for Arabic/RTL-
  script literals matched only `src/i18n/{ar,ckb}.ts` (dictionaries, correct),
  `src/i18n/locales.ts` (native language names, correct -- "never translated"
  per its own doc comment), and `src/lib/mock-data.ts` (explicitly documented
  as tenant data, not chrome, standing in for future API responses --
  defensible and consistent with how real tenant data would render the same
  regardless of UI locale).
- `<html lang dir>` derives from the `locale` cookie in
  `apps/web/src/app/layout.tsx:33-41` for all three locales
  (ar->rtl, en->ltr, ckb->rtl via `localeConfig`) -- code-verified; did not
  independently re-run the dev server to re-confirm the runtime behavior
  frontend-dev already reported (UNVERIFIED at runtime by me specifically,
  but the cookie->config->attribute code path is unambiguous and type-checked).
- Design-token fidelity: `apps/web/src/app/globals.css` `:root`/`.dark` blocks
  matched DESIGN_SYSTEM.md section 6.1 hex-for-hex on manual line-by-line comparison
  (background/foreground/card/primary `#0D6E7D`/`#14808F`/Stone neutrals/
  semantic/chart-1..8/sidebar tokens), including the `--radius: 0.75rem` base
  and shadow tokens. CORRECTION on second pass: the *light-mode* `-soft` tint
  variants (destructive-soft/success-soft/warning-soft/info-soft, e.g.
  `#FEF0EF`/`#EFFBF3`/`#FEF6E7`/`#EBF1FE`) do match section 5.3's documented
  light soft-bg hexes. The *dark-mode* `-soft` values
  (`--destructive-soft: #2a1414`, `--success-soft: #12241a`,
  `--warning-soft: #2a2013`, `--info-soft: #16233a`, globals.css:103,106,109,112)
  are NOT in DESIGN_SYSTEM.md -- section 5.3 documents no dark-mode soft-bg
  column at all. These four hexes were hand-picked, which is a LOW-severity
  deviation from the design system's own top rule ("never hand-pick a hex...
  add it here first, then use it" -- section 1 intro). Not a build/tenant/security
  risk; flagged for the design doc to be updated with an explicit dark
  soft-bg column so future contributors have a source of truth.
- Fonts: Noto Sans Arabic + Inter loaded via `next/font/google` in
  `apps/web/src/app/layout.tsx:2,8-18`; repo-wide grep for `Geist|IBM Plex`
  returned zero matches (confirms create-next-app's default fonts were fully
  replaced, not just visually overridden).
- Performance budget: `package.json` dependencies are minimal -- no chart
  library, no moment.js/dayjs, only `@radix-ui/react-dropdown-menu`,
  `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `lucide-react`,
  `tailwind-merge`. `"use client"` appears in exactly 4 files
  (`sidebar.tsx`, `language-switcher.tsx`, `user-menu.tsx`,
  `dropdown-menu.tsx`) -- all genuinely stateful/interactive (collapse toggle,
  dropdown menus, `useTransition` + `router.refresh()`); every page component is
  a server component.
- Security: no secrets, API keys, or `.env*` files anywhere in `apps/web`
  (grep-verified); no `console.log`/`console.debug`/`console.warn` left in
  `src/`; no inline `style={{...}}` usage that could hide a physical-direction
  bypass.
- Tenant isolation: N/A for `apps/web` at this stage -- every page renders
  `src/lib/mock-data.ts`, there is no live `fetch()` to `apps/api` yet, so
  there is no tenant-scoping code path in the frontend to audit today. Noting
  as a forward-looking item rather than a pass/fail: once real data-fetching
  wrappers are wired in, they must be re-audited for correct `X-Tenant-Id`
  propagation and for not leaking cached data across tenants/sessions.

**Not verified / out of scope**
- Did not launch the dev server / browser to visually confirm RTL mirroring,
  the language-switcher's runtime cookie round-trip, or actual rendered
  line-heights -- all findings above are static-code-path findings (source +
  `tsc`/`eslint`/`next build` output only), consistent with the review being
  report-only.
- `apps/api` not reviewed (out of scope for this pass; see qa-reviewer (api)
  entry above).

## 2026-07-02 — backend-dev (QA fixes)

Fixed all `apps/api` findings from the 2026-07-02 qa-reviewer (api) entry
(#1–#6), targeted fixes only, no unrelated refactoring. `apps/web` untouched.
Every fix has a regression test; 62 pre-existing tests still pass unchanged
plus 28 new ones (12 suites / 90 tests total). `pnpm build` and `pnpm test`
both green (verified below), no live DB used (`prisma generate` only).

**#1 CRITICAL — Cross-tenant FK validation (sections/subjects)**
- Finding: `SectionsService.create/update` and `SubjectsService.create/update`
  spread scalar FK fields from the DTO (`academicYearId`, `gradeLevelId`)
  straight into `data` with no check that the referenced row belongs to the
  caller's tenant — the Prisma tenant-scoping extension only stamps/validates
  a written row's OWN `tenantId`, never scalar FK columns pointing at other
  tenant-scoped models.
- Fix: chose the `assertSameTenant()` helper branch over a composite-FK
  schema change (per the task's own fallback clause) — no live DB is
  reachable in this environment to run/verify a migration, and sharing
  `tenantId` across both the `school` relation and every parent relation
  (`@@unique([tenantId, id])` on every parent, compound `fields:
  [tenantId, parentId]` on every child) is exactly the "fights Prisma too
  much" case the task names, for a guarantee (DB-level FK) that
  `docs/ARCHITECTURE.md` explicitly defers to a later RLS phase anyway.
  New `src/prisma/assert-same-tenant.ts`: `assertSameTenant(finder, code,
  message)` calls a caller-supplied `findFirst` (routed through
  `PrismaService.client`, so the tenant-scoping extension still forces
  `where.tenantId`) and throws `NotFoundException({ code, message })` if it
  returns null — a row from another tenant is therefore indistinguishable
  from a genuinely missing one (no cross-tenant existence oracle). Wired
  into `SectionsService` (checks `academicYearId` + `gradeLevelId`) and
  `SubjectsService` (checks optional `gradeLevelId`), on both `create` and
  `update`, only when the field is actually present in the DTO.
  `academic-years`/`grade-levels` services take no FK from a DTO, no change
  needed there. Documented the rule in `docs/ARCHITECTURE.md` under "API
  conventions" (new "Cross-tenant FK rule" bullet with a code example) so
  `Enrollment`/`StudentGuardian` (not yet built) follow it when they land.
- Tests: `src/prisma/assert-same-tenant.spec.ts` (pure helper: resolves
  when found, throws `NotFoundException` with the given `{code,message}`
  when null/undefined). `src/academics/sections/sections.service.spec.ts`
  and `src/academics/subjects/subjects.service.spec.ts` (mocked
  `PrismaService`, simulate the exact attack: School A creates a
  Section/Subject with an id that only exists for School B — asserts the
  write is rejected, `.create` never called, error code present, and that
  update-time partial DTOs are checked too).

**#2 HIGH — Unguarded `POST /tenants`**
- Finding: `TenantsController` had no guard at all — anyone could script
  unlimited school+owner creation.
- Fix: new `src/common/guards/platform-admin.guard.ts` (`PlatformAdminGuard`)
  checks an `X-Platform-Admin-Key` header against `PLATFORM_ADMIN_API_KEY`
  (env, via `ConfigService`) using `crypto.timingSafeEqual`. Fails CLOSED:
  if the env var is unset/empty, every request is rejected rather than
  silently letting the route through unguarded (the exact bug being fixed).
  Applied via `@UseGuards(PlatformAdminGuard)` on `TenantsController`,
  registered as a provider in `TenantsModule`. Added
  `PLATFORM_ADMIN_API_KEY` to `apps/api/.env.example` with a comment
  explaining the fail-closed behavior. This is explicitly a stopgap shared
  secret, not real platform-admin auth (noted in the controller doc-comment,
  matching the task's framing).
- Tests: `src/common/guards/platform-admin.guard.spec.ts` — missing header,
  wrong key, different-length key, unset-secret (fail-closed), empty-string
  secret (fail-closed), correct key accepted, error code present.

**#3 MEDIUM — Refresh-token reuse/theft detection**
- Finding: a revoked (already-rotated) token was correctly rejected but
  reuse never revoked the rest of that token's descendant chain, so a
  thief who raced the legitimate user through rotation could keep a live
  session.
- Fix: `AuthService.refresh()` (`src/auth/auth.service.ts`) now splits the
  old single combined check into three: unknown token → `SESSION_INVALID`;
  **revoked token → walks `replacedByTokenHash` forward via new private
  `revokeDescendantChain()`, revoking every descendant found (bounded by a
  `visited` set against a pathological cycle), then throws
  `REFRESH_TOKEN_REUSE_DETECTED`**; expired-but-not-revoked →
  `SESSION_EXPIRED`. This directly implements the task's "walk
  replacedByTokenHash, revoke the entire descendant chain" instruction —
  deliberately narrower than revoking ALL of a user's sessions everywhere,
  per the task's own framing ("that token family").
- Tests: `src/auth/auth.service.spec.ts` — 3-token chain (A revoked→B,
  B revoked→C, C live) with A replayed asserts C (the legitimate user's
  live token) gets revoked too, not just A; asserts the reuse rejection
  carries the new code; asserts an unknown token doesn't attempt to walk
  anything; and a regression test proving a fresh, valid token still
  rotates successfully (happy path unchanged).

**#4 MEDIUM — Error i18n / machine-readable codes**
- Finding: every thrown exception carried hardcoded Arabic prose only, no
  code the 3-locale web app could map through its own dictionaries.
- Fix: new `src/common/errors/error-codes.ts` — flat `ErrorCode` const
  covering every distinct error condition in the codebase today.
  `src/common/filters/all-exceptions.filter.ts`: `ApiErrorBody` gained
  `code: string`; reads `record.code` off an `HttpException`'s object
  response body when present, otherwise falls back to a generic
  status-derived code (`BAD_REQUEST`/`UNAUTHORIZED`/`FORBIDDEN`/
  `NOT_FOUND`/`CONFLICT`/`INTERNAL_ERROR`) so nothing ships without SOME
  code — including class-validator's array-message shape (→
  `VALIDATION_ERROR`) and `TenantContextMissingError` (→
  `TENANT_CONTEXT_MISSING`). Every service (`students`, `sections`,
  `subjects`, `academic-years`, `grade-levels`, `users`, `memberships`,
  `tenants`, `auth`) and both guards (`JwtAuthGuard`, `PermissionsGuard`)
  now throw `new XxxException({ code, message })` instead of a bare
  string — `message` stays the Arabic default, `code` is what the web app
  will translate by. Updated `docs/ARCHITECTURE.md`'s error-shape line to
  `{ statusCode, code, message, errors[] }` with the throw convention.
- Tests: `src/common/filters/all-exceptions.filter.spec.ts` — explicit
  `{code,message}` body passthrough, status-derived fallback code,
  validation-array → `VALIDATION_ERROR`, `TenantContextMissingError` →
  `TENANT_CONTEXT_MISSING`, unknown `Error` → `INTERNAL_ERROR`/500. Every
  new test added for #1/#2/#3 above also asserts its exception's `code`.

**#5 LOW — CORS allowlist + `strictPropertyInitialization`**
- CORS: `main.ts` now calls `app.enableCors({ origin: getAllowedOrigins() })`
  instead of the previous no-options `enableCors()` (which reflects any
  origin). `getAllowedOrigins()` reads `CORS_ORIGINS` (comma-separated env
  var, trimmed/filtered), defaulting to `http://localhost:3000`. Added
  `CORS_ORIGINS` to `.env.example`.
- `strictPropertyInitialization`: removed the `false` override in
  `tsconfig.json` (it's implied `true` by `strict: true` once not
  explicitly disabled). Ran `pnpm build` after the flip — zero fallout,
  because every DTO already used definite-assignment (`!`) and every other
  class property is either constructor-injected (`private readonly x: T`)
  or has an inline default (e.g. `PrismaService.client`,
  `PaginationQueryDto.page/pageSize`). No code changes needed beyond the
  tsconfig line itself.

**Not touched (explicitly out of scope, per the qa-reviewer's own ranking)**
- #7 (account-existence oracle via phone/email lookup) and #8
  (informational — `TenantContextMiddleware` not validating `X-Tenant-Id`
  against a real `School` row, by design) were not in this task's fix list
  and were left as-is.

**Shared files touched (allowed/required per CLAUDE.md rule #2)**
- `docs/ARCHITECTURE.md` — added the "Cross-tenant FK rule" bullet and
  updated the error-response-shape bullet (both under "API conventions"),
  as required by the task ("document the rule in ARCHITECTURE.md").

**Build/test verification (actual output)**
- `pnpm prisma:generate` — PASS (no live DB; schema→client codegen only).
- `pnpm build` (`tsc -p tsconfig.build.json`) — PASS, exit 0, zero errors,
  including after the `strictPropertyInitialization` flip.
- `pnpm test` (jest) — PASS: 12 suites, 90 tests, all green (62
  pre-existing + 28 new: `assert-same-tenant.spec.ts` (3),
  `sections.service.spec.ts` (5), `subjects.service.spec.ts` (4),
  `platform-admin.guard.spec.ts` (7), `auth.service.spec.ts` (4),
  `all-exceptions.filter.spec.ts` (5)).

**Key decisions**
- Helper over composite-FK schema change for #1 (see above) — the task's
  own sanctioned fallback, chosen because this environment cannot run or
  verify a migration, and because a DB-level FK guarantee is explicitly a
  later-phase concern per `docs/ARCHITECTURE.md`'s RLS note.
- `assertSameTenant` takes a callback (`() => Promise<unknown>`) rather
  than a typed Prisma delegate object, sidestepping any structural-typing
  friction with Prisma's generated per-model `findFirst` argument types
  and keeping the helper trivially unit-testable with a plain `jest.fn()`.
- Refresh-token reuse handling walks strictly `replacedByTokenHash`
  forward from the reused token (that token's own descendant family) —
  did not broaden to "revoke all of this user's sessions everywhere",
  matching the task's literal instruction and keeping the blast radius
  scoped to the actual compromised chain. `RefreshToken` is platform-level
  (not in `TENANT_SCOPED_MODELS`), so the chain walk needed no tenant
  context of its own.
- Reused-*logged-out* tokens (not just reused-*rotated* ones) also surface
  as `REFRESH_TOKEN_REUSE_DETECTED` — logout sets `revokedAt` without a
  `replacedByTokenHash`, so the chain walk is a harmless no-op in that
  case; still correctly rejected, just via the same code path.

**Blockers**
- None. No live Postgres was started or migrated; all fixes verified via
  `pnpm build` + `pnpm test` only, per project convention.

## 2026-07-02 — frontend-dev (QA fixes)

Fixed all `apps/web` findings from the 2026-07-02 qa-reviewer (web) entry
(#1–#5), targeted fixes only. `apps/api` untouched (another agent working
there concurrently, per instruction). `pnpm build` and `pnpm lint` both green
(verified below); also ran the dev server and curl-tested the live behavior
of every finding except logout (see #1), not just static-code-path review.

**#1 MEDIUM — No auth guard on the dashboard route group**
- Finding: no `middleware.ts` existed anywhere; `/`/`/dashboard` rendered
  unconditionally with no session check; `loginAction` was a no-op stub.
- Fix: `src/lib/session.ts` exports a shared `SESSION_COOKIE = "session"`
  constant. `src/middleware.ts` — no `session` cookie → redirect to
  `/login`; `session` cookie present on `/login` → redirect to `/dashboard`;
  matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and any
  path with a file extension (so an unauthenticated request for a future
  `/public` asset isn't 307'd to `/login`). `src/actions/auth.ts`:
  `loginAction` now sets the `session` cookie (`httpOnly`, `sameSite: lax`,
  `path: /`, 7-day `maxAge`) and `redirect("/dashboard")` — still a stub (no
  JWT/backend call yet, per the task), but the cookie/guard plumbing around
  it is real. Added `logoutAction` (clears the cookie, redirects to
  `/login`), wired into `UserMenu`'s "تسجيل الخروج" item via a real
  `<form action={logoutAction}>` with a `DropdownMenuItem asChild` submit
  button (`onSelect` calls `event.preventDefault()` so Radix's default
  close-on-select doesn't unmount the form/Portal before the submit is
  processed — the page navigates away via `redirect()` regardless once it
  does fire).
- Verified live (dev server + curl, not just static review): `/dashboard`
  and `/` with no cookie → `307` to `/login`; `/login` with no cookie →
  `200`; `/login` with `session=stub` → `307` to `/dashboard`; `/dashboard`
  with `session=stub` → `200`. **Not** independently click-tested in an
  actual browser — server actions can't be curl-tested (no action-ID/RSC
  encoding without executing JS, and no browser tool is available in this
  environment) — logout is code-reviewed plus the known Radix+form
  race defensively fixed, but flagging this as the one item I couldn't
  observe end-to-end myself.

**#2 MEDIUM — Arabic per-size line-heights (§3.2) not implemented**
- Finding: only a blanket `body { line-height }` rule existed; Tailwind's
  `text-*` utilities set their own line-height per element (they don't
  inherit body's), so every sized heading/value silently used Tailwind's
  Latin-tuned default regardless of locale.
- Fix: confirmed via the actual compiled CSS (not assumed) that Tailwind
  v4's `text-*` utilities reference `var(--text-*--line-height)` rather than
  a baked-in literal (`.text-2xl{font-size:var(--text-2xl);line-height:
  var(--tw-leading,var(--text-2xl--line-height))}`), and that Tailwind's own
  defaults for these tokens ship inside `@layer theme`. Added all 8
  `--text-*--line-height` tokens from the §3.2 table as plain (unlayered)
  declarations in `globals.css`: Arabic/Kurdish values at `:root` (`ar` is
  the default locale; `ckb` needs no separate selector — it never matches
  the `en` override and so shares `:root`'s Arabic column, matching §4's
  "Kurdish behaves exactly like Arabic layout-wise"), Latin values under
  `html[lang="en"]`. Per the CSS cascade-layers spec, unlayered rules always
  beat layered ones regardless of specificity, so no `!important` needed.
  Hardcoded the exact table values rather than the doc's illustrative
  `--lh-scale: 1 / 0.88` multiplier — that shortcut doesn't reproduce every
  cell exactly (e.g. it gives `text-2xl`/en = 1.364, not the table's 1.35),
  and the task's own acceptance test ("verify text-2xl actually gets the
  §3.2 value") requires the exact number.
- Verified: rebuilt and grepped the compiled CSS — `--text-2xl--line-height:
  1.55` at `:root` and `:1.35` under `html[lang=en]`, both confirmed
  outside any `@layer` block by a brace-depth scan of the compiled output
  (not inferred from source).

**#3 MEDIUM — Mobile navigation unreachable below `md`**
- Finding: `Sidebar` was `hidden ... md:flex` with no trigger anywhere;
  below 768px there was no way to reach any nav item except typing a URL.
- Fix: extracted the nav-item list out of `Sidebar` into an exported
  `SidebarNavList` component (`sidebar.tsx`) — same items/icons/active-state
  logic, now a single source of truth instead of a second copy. New
  `src/components/layout/mobile-nav.tsx` (`MobileNav`, client component):
  a hamburger button (`md:hidden`) in the topbar opens an off-canvas drawer
  that renders `SidebarNavList`. The drawer slides in purely via the
  logical `inset-inline-start` offset (`start-[-100%]` → `start-0` with a
  CSS transition) rather than a `transform`/`translate-x`, so it reverses
  direction automatically under `dir="rtl"` vs `dir="ltr"` with zero
  direction-specific code — no `rtl:`/`ltr:` variant needed. Closes on
  backdrop click, `Escape`, and route change (`usePathname()` effect); the
  closed panel is also `inert` so its off-canvas links drop out of the tab
  order, not just the a11y tree. `Topbar` now takes `navLabels`/
  `schoolInitial` props to pass through. Added `nav.openMenu`/
  `nav.closeMenu` to `Dictionary` + all 3 locale files (TypeScript enforces
  parity — build would fail on a missing key in any locale).
- Verified live: dev server render of `/dashboard` includes the hamburger
  (`aria-label="فتح القائمة"`) and drawer-close (`aria-label="إغلاق
  القائمة"`) buttons in the served HTML alongside the pre-existing desktop
  sidebar toggle.

**#4 LOW — §3.3 numerals: no `Intl.NumberFormat` call site**
- Finding: only the CSS half of the numerals rule existed
  (`font-variant-numeric: normal`); every number in the app was a
  pre-formatted mock string, so nothing actually exercised
  `Intl.NumberFormat("en-u-nu-latn", …)`.
- Fix: new `src/lib/format.ts` — `formatNumber`, `formatCurrencyIQD`
  (whole-IQD, no fraction digits, matches CLAUDE.md's "money stored as
  BigInt, no decimals"; accepts `number | bigint`), `formatDate` (Asia/
  Baghdad timezone per CLAUDE.md), all locked to the `en-u-nu-latn` locale
  regardless of the active UI locale. `mock-data.ts`'s `mockKpis` now holds
  raw numbers/fractions (e.g. `attendance: { value: 0.942, delta: 0.021 }`)
  instead of pre-formatted strings; `dashboard/page.tsx` formats them at the
  call site (`formatNumber`/`formatCurrencyIQD`, percent style for the rate
  deltas, `signDisplay: "exceptZero"` for the students delta's `+12`).
  **Interpretation note**: the task said "use them for the KPI values and
  students mock data" — read this as *the four dashboard KPI values
  (including the "students" KPI)*, not the student roster table. The
  roster's `registryNo`/`guardianPhone` are ID/phone strings, not
  `Intl.NumberFormat` inputs, and are already literal Western-digit source
  strings (already §3.3-compliant, nothing to reformat). Flagging this
  interpretation explicitly in case the roster was intended instead.
  `formatDate` has no live call site yet — no `Date` object exists anywhere
  in the current mock data (only pre-written relative-time strings like
  "قبل 12 دقيقة"); it's implemented per the finding's ask but unexercised
  until real date data lands.
- Verified live: dev server render of `/dashboard` with `locale=ckb`
  produces Western digits (`1,284`, `94.2%`), not Eastern Arabic-Indic —
  confirms the `-u-nu-latn` override actually takes effect under a
  non-`en` locale, not just under `en` where it'd be invisible either way.
  All 4 KPI tiles' rendered values/deltas matched the original hardcoded
  strings exactly (`1,284`/`+12`, `94.2%`/`2.1%`, `42,350,000`/`8.4%`,
  `8`/`5`).

**#5 LOW — Undocumented dark-mode soft-tint hexes**
- Finding: `globals.css`'s dark-mode `-soft` tokens (destructive/success/
  warning/info) were hand-picked, not in `DESIGN_SYSTEM.md` §5.3, violating
  the doc's own "never hand-pick a hex, add it here first" rule.
- Fix: computed WCAG contrast (relative-luminance method, same as the rest
  of §5) for each dark soft-bg against that role's paired dark text color
  (the `bg-X-soft text-X` pattern already used by `badge.tsx` and the
  dashboard's `toneClasses`): success 7.13:1, warning 7.83:1, danger 6.28:1,
  info 6.18:1 — all clear AA (4.5:1) comfortably, success/warning also clear
  AAA. Appended a new "§5.3.1 Dark-mode soft tints (provisional)" section to
  `docs/DESIGN_SYSTEM.md` with the table and an explicit "awaiting designer
  ratification" note, per the task. No code/hex values changed — this is
  documentation only, closing the "undocumented" gap, not a color change.
- **Shared file touched**: `docs/DESIGN_SYSTEM.md` (ui-designer's file) —
  per CLAUDE.md rule #2, noting it here. Addition only (new subsection),
  nothing existing edited/removed.

**#6 LOW — §7.2 sidebar auto-collapse below 1280px**
- Finding: collapse-to-icon-rail was a manual-only toggle; §7.2 calls for
  auto-collapsing on first load below 1280px.
- Fix: `Sidebar` now runs a one-time `useEffect` (empty deps — mount only)
  checking `window.matchMedia("(max-width: 1279.98px)")` and defaulting
  `collapsed` to `true` if it matches. Because this effect has no
  dependencies and never re-runs, the manual toggle button is the only
  thing that can change `collapsed` after mount — "manual toggle still wins
  afterwards" is structural, not a flag/priority check.

**Build/lint verification (actual output)**
- `pnpm build` — PASS, compiled successfully, type-check clean, all 4
  routes still `102 kB` first-load JS (unchanged from the pre-fix
  baseline — no new client bundle weight beyond the small `mobile-nav.tsx`/
  `user-menu.tsx` additions), plus a new `Middleware` bundle (`34.3 kB`,
  edge runtime).
- `pnpm lint` (eslint) — PASS, zero output.
- Repo-wide grep for physical-direction utilities (`ml-|mr-|pl-|pr-|left-|
  right-|text-left|text-right|border-l-|border-r-|rounded-l-|rounded-r-|
  translate-x`) — zero matches in `src/` (one docstring comment in
  `mobile-nav.tsx` mentions "translate-x" by name to explain why it's
  *not* used; not a class usage).

**Key decisions**
- Extracted `SidebarNavList` instead of writing a second nav-item list for
  the mobile drawer — one source of truth for items/icons/active-state, per
  the task's explicit "reuse the existing sidebar nav list."
- Mobile drawer slide animation uses logical `inset-inline-start`, not
  `transform: translateX()` gated by an `rtl:`/`ltr:` Tailwind variant —
  avoids any physical-axis value in the codebase at all, even a
  conditionally-flipped one, keeping the "logical properties only" rule
  literal rather than "effectively direction-correct but technically
  physical."
- Kept `KpiCard` itself untouched (still takes pre-formatted `value`/
  `delta.value` strings) and did the `Intl` formatting in the page instead
  — the task's fix is "wire numerals through Intl," not "redesign the KPI
  tile," so the `dataviz` skill's stat-tile contract wasn't re-invoked for
  this pass (no chart/tile/dashboard-layout was built or restructured).

**Blockers**
- None. Logout's end-to-end click behavior is asserted via code review +
  a defensive fix for a known Radix-dropdown/form race, not observed in an
  actual browser (no browser-automation tool available in this
  environment) — see #1 above.

## 2026-07-02 — frontend-dev (API wiring)

Wired `apps/web` to the real `apps/api` backend: typed API client, real
auth (login/refresh/logout, replacing the `session`-cookie stub), and the
students page against `GET /api/v1/students`. `apps/api` treated strictly as
read-only reference — every request/response shape below was verified by
reading its controllers/DTOs/services, not guessed. `apps/api` untouched.
Docker is unavailable in this environment (`docker --version` fails in both
PowerShell and Git Bash), and `PrismaService.onModuleInit()` calls
`$connect()` eagerly, so `apps/api` cannot even boot without a live Postgres
— **the full login→students e2e flow is UNVERIFIED**, exactly as CLAUDE.md's
Docker-unavailable fallback anticipates. `pnpm build`/`pnpm lint` both green;
the `apps/web` dev server itself was started and smoke-tested standalone
(see "Verified live" below) to check everything that doesn't require a
running API.

**What was built**
- **Typed API client** (`src/lib/api/`): `config.ts` (`API_BASE_URL` =
  `API_URL` env, default `http://localhost:3001` + `/api/v1` — apps/api's
  OWN default per `main.ts`/`.env.example`, NOT the 4000 the task text
  assumed), `client.ts` (`apiFetch<T>`, server-only), `errors.ts`
  (`ApiError`), `error-codes.ts` (hand-mirrored `ApiErrorCode` union of every
  code in `apps/api/src/common/errors/error-codes.ts`, + `fallbackCodeForStatus`
  mirroring `AllExceptionsFilter`'s own fallback), `cookie-config.ts` +
  `edge-jwt.ts` (framework-agnostic — importable from both Node and Edge
  runtime), `tokens.ts` (`next/headers`-based cookie read/write, Node-only),
  `auth.ts` (`apiLogin`/`apiLogout`), `students.ts` (`listStudents`),
  `translate-error.ts` (`getApiErrorMessage`). Every request sends
  `X-Tenant-Id` (from the `tenant` cookie, dev fallback `DEV_TENANT_ID` env)
  and, unless `skipAuthHeader`, `Authorization: Bearer <access token>`;
  every fetch is `cache: "no-store"` (tenant-scoped data must never hit
  Next's fetch cache across tenants/sessions). Error codes are mapped
  through a new `Dictionary["errors"]: Record<ApiErrorCode, string> &
  { generic }` — TypeScript enforces all ~30 codes are present in all 3
  locale files (verified: `tsc --noEmit` green after adding all 30 to
  `ar.ts`/`ckb.ts`/`en.ts`).
- **Real auth**: `src/actions/auth.ts` — `loginAction` (now `(prevState,
  formData) => LoginFormState`, used via React 19's `useActionState`) calls
  `POST /auth/login` (`identifier` = phone-or-email + `password`, matching
  `LoginDto` exactly), sets httpOnly `access_token`/`refresh_token` cookies
  (`setAuthCookies`, maxAge parsed from the response's `expiresIn` /
  hardcoded 30d for the refresh token per apps/api's default — the API never
  echoes the refresh token's own TTL), redirects to `/dashboard`.
  `logoutAction` calls `POST /auth/logout` (revokes the refresh token
  server-side, best-effort — a failure there never blocks logout), clears
  cookies, redirects to `/login`. New `src/components/auth/login-form.tsx`
  (client component, the only new client JS) renders general + field-level
  errors from `LoginFormState`; field-level errors are derived by pattern-
  matching `VALIDATION_ERROR`'s raw class-validator messages for
  "identifier"/"password" and re-expressing them as OUR OWN translated
  copy (`auth.identifierFieldError`/`passwordFieldError`) — never displaying
  the API's raw English validation prose in an Arabic/Kurdish UI.
- **Token refresh** — deliberately split across two layers because Next.js
  only allows cookie mutation from Middleware/a Server Action/a Route
  Handler, never during a plain Server Component render, and the refresh
  token is single-use/rotating (a refresh whose result can't be persisted
  strands the browser with an already-consumed token):
  - **Proactive** (`src/middleware.ts`, rewritten): decodes the
    `access_token` JWT's `exp` (unverified — courtesy check only, the API
    always re-verifies the signature) on every matched request; if
    missing/expired but `refresh_token` is present, calls `POST
    /auth/refresh` from Middleware (Edge-safe plain `fetch`, no
    `next/headers`) and persists the rotated tokens on `request.cookies`
    (via `NextResponse.next({ request })`, per Next's own documented
    pattern — makes them visible to THIS request's Server Components too)
    AND `response.cookies` (for the browser). Route gating uses
    `refresh_token` presence, not a stubbed `session` cookie or
    `access_token` alone — access tokens naturally expire every ~15 minutes
    and are refreshed transparently here rather than forcing a redirect.
  - **Reactive fallback** (`apiFetch` in `src/lib/api/client.ts`): on a 401
    with code `SESSION_EXPIRED`/`AUTH_REQUIRED`, attempts one refresh and
    retries once; cookie persistence is wrapped in try/catch since it may
    be called from a Server Component render (where Next.js throws on
    `cookies().set()`) — if persistence fails, the fresh token still
    completes THIS request's retry (passed in-memory, not re-read from
    cookies), but the browser stays on the stale cookie until the next
    navigation's proactive refresh. If refresh fails outright, clears
    cookies (best-effort) and `redirect("/login")`. Documented as a known,
    accepted limitation in both files' doc comments and in
    `docs/RUN_LOCAL.md` — untestable here regardless (no live DB → no
    successful login → can't reach this code path at all).
  - Removed `src/lib/session.ts` (the old stubbed `session`-cookie
    constant) — superseded by `access_token`/`refresh_token`.
- **Students page** (`src/app/(dashboard)/students/page.tsx`, rewritten):
  server-component fetch to `GET /api/v1/students` via `listStudents()`,
  query params (`page`, `pageSize`, `search`) matching `PaginationQueryDto`
  exactly, sourced from the URL's `searchParams` (Next 15: awaited as a
  `Promise`). Search is a plain `<form method="get">` (zero client JS,
  matches the 3G/minimal-JS budget) with a visually-hidden submit button for
  keyboard/screen-reader users who don't rely on Enter. Prev/Next pagination
  as plain anchors preserving `search`, with a `{page} من {total}`-style
  indicator (`dict.students.pageIndicator`, `{page}`/`{total}` placeholders
  substituted at the call site — position-independent for locale word-order
  differences). Loading state: `<Suspense key={page:search}>` around an
  async `StudentsResults` component with an 8-row skeleton (`aria-busy`) —
  the search bar/heading/add-button render immediately, not blocked on the
  fetch. Error state: catches `ApiError`, maps through
  `getApiErrorMessage`, renders a translated message + a "retry" link
  (per DESIGN_SYSTEM §7.5's icon + explanation + single action pattern).
  Empty state (zero results, no error): separate translated "no matching
  results" card with a hint, distinct from the error card.
  **Table columns changed from the mock-data version**: `StudentsService.list()`
  (`apps/api/src/students/students.service.ts`) does a bare `findMany` with
  NO `include` — it returns only `Student` scalars (`fullName`,
  `studentNumber`, `dateOfBirth`, `gender`, `nationalId`, `address`,
  `isActive`, ...), never Section, guardian phone, or a tri-state
  active/suspended/transferred status (those live on `Enrollment`'s
  `sectionId`/`status` and `StudentGuardian → Guardian → User.phone`
  relations the endpoint doesn't join). Rebuilt the table against what the
  API actually returns: name + registry no. (unchanged), **gender**
  (new), **date of birth** (new, via `formatDate`), and a two-state
  **active/inactive** badge (`isActive`) replacing the old three-state
  mock badge — removed `columnSection`/`columnGuardianPhone`/
  `statusSuspended`/`statusTransferred` from the dictionary type (all 3
  locales) since nothing produces that data today. See "API changes
  needed" below — did not invent client-side data to preserve the old
  columns.
  Cleaned up `src/lib/mock-data.ts`: removed `mockStudents`/`MockStudent`/
  `StudentStatus` (no longer used anywhere); kept `mockSchool`, `mockUser`,
  `mockActivity`, `mockKpis` exactly as instructed (dashboard KPIs have no
  API yet).
- **Dev-runnability**: confirmed Docker unavailable (`docker --version`
  fails, both shells) → wrote `docs/RUN_LOCAL.md` (exact copy-paste steps:
  `docker compose up -d postgres redis` → `apps/api/.env` from
  `.env.example` → `prisma migrate dev` → `pnpm seed` → **create a demo
  school + owner via `POST /tenants`** with the `X-Platform-Admin-Key`
  header, since `prisma/seed.ts` seeds only the global permission catalog,
  not a demo tenant — curl examples for the full create-school → login →
  students-list → search → create-student flow, and the exact
  `apps/web/.env.local` values needed). New `apps/web/.env.example`
  (`API_URL`, `DEV_TENANT_ID`, both documented).

**Verified live vs. build-only**
- Build-only (no live API reachable at all — Docker unavailable,
  `PrismaService.onModuleInit()` `$connect()`s eagerly so `apps/api` cannot
  even boot without Postgres): the actual login → cookie → students-list →
  search round trip against a running API. This is the one item the task
  asked to verify live that genuinely could not be attempted here.
- Verified live (`apps/web` dev server started standalone on port 3100,
  curl-tested, then stopped):
  - `GET /login` with no cookies → `200`, real `LoginForm` markup present
    (`identifier`/`password` fields, Arabic labels) — confirms the server
    component + client `LoginForm` render correctly together.
  - `GET /dashboard`, `GET /students` with no cookies → `307` to `/login`
    (middleware's route guard, now driven by `refresh_token` presence
    instead of the old stub).
  - `GET /dashboard` with a garbage `refresh_token` cookie and the API
    unreachable (nothing listening on port 3001) → middleware's proactive
    refresh attempt fails gracefully (try/catch around the Edge `fetch`)
    and still `307`s to `/login` — confirms the "API is down" path doesn't
    crash the middleware/edge function.
  - `pnpm build` and `pnpm lint` — both green (`apps/web`), zero TypeScript
    errors (`tsc --noEmit`), zero RTL-discipline grep hits
    (`ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|border-l-|
    border-r-|rounded-l-|rounded-r-`) across `src/`.

**API changes needed (none made — apps/api is read-only for this task)**
1. `GET /api/v1/students` returns bare `Student` scalars with no `include`.
   To show Section and Guardian phone (both present in the original mock
   table and in `docs/ARCHITECTURE.md`'s data model) the list endpoint
   would need to join the student's active `Enrollment` (→ `Section`) and
   `StudentGuardian` (→ `Guardian` → `User.phone`) — or expose a dedicated
   summary DTO/endpoint that does. Left the table showing only what the API
   returns today (name, registry no., gender, date of birth, active/
   inactive) rather than inventing client-side data for the missing
   columns.
2. No endpoint currently seeds/returns a demo school — `POST /tenants` (the
   only way to create one) is a platform-admin action, which is correct
   per its own doc comment, but means every fresh local setup requires the
   manual curl step in `docs/RUN_LOCAL.md` step 4. Not proposing a change
   here (seeding a demo tenant automatically would be a footgun for a real
   deployment), just noting it as the reason full e2e needs one extra
   manual step beyond `pnpm seed`.

**Key decisions**
- Split the refresh flow across Middleware (proactive, cookie-writable) and
  `apiFetch` (reactive fallback, best-effort cookie persistence) rather than
  putting all refresh logic in the API client wrapper as the task's literal
  wording suggested — Next.js's cookie-mutation-during-render restriction
  makes a wrapper-only implementation actively unsafe with single-use
  rotating refresh tokens (a refresh call that can't persist its result
  strands the browser on an already-consumed token, risking a false
  `REFRESH_TOKEN_REUSE_DETECTED` on the very next request). Full rationale
  in `src/middleware.ts`'s and `src/lib/api/client.ts`'s doc comments.
- Route gating keys off `refresh_token` cookie presence, not `access_token`
  — the access token intentionally expires every ~15 minutes as part of
  normal operation and is refreshed transparently; gating on it would force
  a visible redirect-to-login every 15 minutes of activity instead of a
  silent refresh.
- Field-level login errors are derived from `VALIDATION_ERROR`'s raw
  class-validator messages by matching the DTO property name
  ("identifier"/"password") in the message string, then substituting OUR
  OWN translated copy — never the API's raw (English, untranslated)
  validation prose. In practice this rarely fires: the form's native
  `required` attributes catch empty submissions client-side, and
  `INVALID_CREDENTIALS`/`NO_SCHOOL_ACCESS`/etc. (the realistic login
  failures) surface as the general banner instead, since the API doesn't
  say which field was wrong for those.
- `error-codes.ts` is a hand-kept mirror of `apps/api/src/common/errors/
  error-codes.ts` rather than a cross-workspace import — consistent with
  treating `apps/api` as read-only reference and avoiding a build-time
  dependency between the two apps.

**Post-implementation fix (same session, pre-report self-review)**
- Bug: `StudentsResults`'s `try/catch` around `listStudents()` unconditionally
  treated every caught error as an `ApiError`-or-generic display case. Since
  Next.js's `redirect()` (called inside `apiFetch` when a refresh attempt
  fails) works by throwing a special `NEXT_REDIRECT` error the framework
  expects to propagate, that catch block was silently swallowing it and
  rendering the generic error card instead of redirecting to `/login` — the
  one path the task explicitly required ("if refresh fails, redirect to
  /login") wasn't actually reachable from the students page. Fixed with
  `unstable_rethrow(error)` (from `next/navigation`, available since Next
  15.0) as the first line of the catch block, which re-throws
  `NEXT_REDIRECT`/`NEXT_NOT_FOUND` and is a no-op for any other error.
  `loginAction`/`logoutAction` were already unaffected — their `redirect()`
  calls are outside any try/catch. Also added `skipAuthRefresh: true` to
  `apiLogin` to make explicit (rather than incidental) that a failed login
  can never trigger a refresh-and-retry. `pnpm build`/`pnpm lint` re-verified
  green after both changes.

**Blockers**
- Full login→students e2e is unverified (Docker unavailable in this
  environment; `apps/api` cannot boot without a live Postgres regardless of
  Docker, since `PrismaService.onModuleInit()` connects eagerly) — see
  `docs/RUN_LOCAL.md` for the exact steps + demo credentials a developer
  with Docker should run to close this gap. No `apps/api` changes were
  made or are required to unblock it; it's purely an environment
  limitation, not a code issue.
