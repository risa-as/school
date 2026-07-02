# Architecture — Multi-Tenant School ERP

## Tenancy model
- Hierarchy: **Organization** (مجمّع تعليمي) → **School** (tenant) → Academic Years → Grades/Stages → Sections.
- Shared PostgreSQL database; every tenant-scoped table carries `tenantId` (= School id). Row-Level Security enforced at DB level later; app-level scoping via a global Prisma middleware / tenant context from day 1.
- Tenant resolution: `X-Tenant-Id` header (dev) → subdomain (`{school}.app.tld`) in production.
- Platform-level data (organizations, schools, plans, subscriptions, platform users) is NOT tenant-scoped.

## Core entities (Phase 1)
- `Organization` (id, name, ownerId) — optional parent of schools.
- `School` (tenant): id, organizationId?, name, slug (subdomain), stage types, timezone, settings JSON.
- `User`: platform-unique by phone/email; belongs to one or more schools via `Membership` (userId, schoolId, roleId). Parents may span schools.
- RBAC: `Role` (per-school, seeded defaults: owner, principal, registrar, accountant, teacher, parent, student) → `Permission` (global catalog, e.g. `students.read`, `fees.collect`) via `RolePermission`.
- `AcademicYear` (per school, e.g. 2025-2026, active flag), `GradeLevel`, `Section` (شعبة), `Subject`.
- `Student` (per school) + `Enrollment` (studentId, academicYearId, sectionId, status) + `Guardian` (link to User) + `StudentGuardian`.
- Attendance: `AttendanceRecord` (enrollmentId, date, status: present/absent/late/excused, takenById).
- Grades: `Assessment` (subject, term: first-half/second-half/final/resit, maxScore) + `Score`.
- Fees: `FeeStructure` (per grade/year), `StudentFee` (assigned, discount, scholarship), `Installment` (due date, amount), `Payment` (method: cash/zaincash/qi/fib, receiptNo sequential per school), `Receipt`.

## API conventions
- NestJS modules per domain: `auth`, `tenants`, `users`, `rbac`, `students`, `academics`, `attendance`, `grades`, `fees`, `notifications`.
- Auth: JWT access (15m) + refresh (30d rotating). Login by phone or email + password. 2FA for admin roles later.
- Every request (except platform/auth routes) runs through TenantContextMiddleware → injects `tenantId` into async-local-storage; Prisma client extension auto-filters by it.
- Validation: class-validator DTOs; errors returned as `{ statusCode, code, message, errors[] }` — `code` is a stable, machine-readable identifier (`src/common/errors/error-codes.ts`) the 3-locale (ar/ckb/en) frontend maps through its own dictionaries; `message` stays the Arabic default. Throw with `new XxxException({ code, message })` (built-in Nest exceptions accept an object body) — never a bare string — so every error lands in the global filter with a code.
- **Cross-tenant FK rule**: the Prisma tenant-scoping extension (`src/prisma/tenant-scoping.ts`) stamps/validates a written row's OWN `tenantId` and walks nested relation *objects* (`create`/`createMany`/`connectOrCreate`) — it does NOT and cannot inspect plain scalar FK fields on a DTO (e.g. `academicYearId`, `gradeLevelId`, and in future `studentId`/`sectionId`/`guardianId`) that reference another tenant-scoped model. Every service `create`/`update` method that accepts such a scalar FK from a DTO MUST verify the referenced row belongs to the current tenant before writing, via `assertSameTenant()` (`src/prisma/assert-same-tenant.ts`), e.g.:
  ```ts
  await assertSameTenant(
    () => this.prisma.client.academicYear.findFirst({ where: { id: dto.academicYearId } }),
    ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
    'السنة الدراسية غير موجودة',
  );
  ```
  This works because `findFirst` still goes through the tenant-scoping extension, which forces `where.tenantId`, so a row from another tenant comes back `null` — indistinguishable from a genuinely missing row (no cross-tenant existence oracle). Applied today in `sections.service.ts` and `subjects.service.ts`; required for `Enrollment` and `StudentGuardian` the moment those modules are built. Platform-level FK targets (e.g. `User` via `userId`) are exempt — they are not tenant-scoped in the first place.

## Frontend conventions
- Next.js App Router. Route groups: `(auth)` login/reset, `(dashboard)` main shell, `(superadmin)` platform panel (later).
- i18n: three first-class locales — `ar` (default, RTL), `ckb` Central Kurdish/Sorani (RTL, Arabic script), `en` (LTR). Dictionaries in `src/i18n/{ar,ckb,en}.ts` sharing one typed key schema. Language switcher in the topbar; choice persisted in a cookie (and later in user profile). Root layout derives `dir`/`lang` from the active locale (ar→rtl, ckb→rtl, en→ltr).
- Fonts: the Arabic-script font MUST cover Kurdish-Sorani glyphs (ە ڕ ڵ ۆ ێ پ چ گ ڤ) — verify coverage (e.g. Noto Sans Arabic or Vazirmatn if IBM Plex Sans Arabic lacks them); pair with a Latin font for `en`.
- Data fetching: server components + fetch to API; client mutations via typed fetch wrappers (React Query later).
- Design tokens come from `docs/DESIGN_SYSTEM.md` → CSS variables in `globals.css`.

## Local dev infrastructure
- `docker-compose.yml` at repo root: postgres:16 + redis:7 (+ adminer optional). `.env.example` in each app.
- No live DB required to build; Prisma `generate` only. Migrations run explicitly by developer.

## Phases
1. **MVP**: SIS + academic structure + attendance + grades + fees + notifications + parent app (later Flutter).
2. HR/payroll, LMS-lite, transport, library, analytics dashboards.
3. Ministry-of-Education official report templates, AI early-warning, multi-school org dashboards.
