# Running the stack locally (apps/api + apps/web)

**Status: UNVERIFIED end-to-end.** Docker is not available in the environment
this doc was written in (`docker --version` fails in both the PowerShell and
Git Bash tools), so `apps/api` was never actually started against a live
Postgres and the flow below was never executed against a running server.
Every step is transcribed exactly from `apps/api`'s source (`.env.example`,
`main.ts`, DTOs, service return shapes) so it should work as written — but
treat it as unverified until someone with Docker runs it once. `apps/web`
itself builds and its own dev server was smoke-tested (login page renders,
middleware redirects, graceful handling of an unreachable API) — see
`docs/PROGRESS.md`'s 2026-07-02 "frontend-dev (API wiring)" entry for exactly
what was/wasn't verified.

## 0. Prerequisites

- Docker Desktop (or a local Postgres 16 + Redis 7 you point `DATABASE_URL`/
  `REDIS_URL` at instead of the compose file).
- Node.js + pnpm already set up for this monorepo (`pnpm install` at the repo
  root).

## 1. Start Postgres + Redis

```bash
# from the repo root
docker compose up -d postgres redis
```

Confirm both are healthy: `docker compose ps` should show `postgres` and
`redis` as `healthy` (the compose file has healthchecks for both).

## 2. Configure and migrate apps/api

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` if you changed any compose defaults; the defaults match the root
`docker-compose.yml` exactly (`school`/`school`/`school_erp` on `5432`) so
usually no edits are needed. Two values you SHOULD set to something
non-default even locally (the guard/JWT code fails closed without them, but
the placeholder strings work fine for local dev):

- `JWT_ACCESS_SECRET` — any non-empty string.
- `PLATFORM_ADMIN_API_KEY` — any non-empty string; you'll send it as
  `X-Platform-Admin-Key` in step 4. `PlatformAdminGuard` rejects EVERY
  request if this env var is unset/empty (fails closed), so it must be set.

```bash
pnpm prisma:generate
pnpm exec prisma migrate dev --name init
pnpm seed          # seeds the global RBAC permission catalog only —
                    # NOT a demo school/user, see step 4
```

## 3. Start apps/api

```bash
pnpm dev
# "school-erp api listening on :3001/api/v1"
```

Leave this running in its own terminal. Default port is **3001**, not 4000 —
verified against `apps/api/src/main.ts:22` and `apps/api/.env.example`.

## 4. Create a demo school + owner account

There is no seeded demo school (`prisma/seed.ts` only seeds the permission
catalog). `POST /tenants` is the platform-level endpoint that creates a
`School` + its owner `User` + owner `Membership` in one call, guarded by
`PlatformAdminGuard` (the `X-Platform-Admin-Key` header, matching
`PLATFORM_ADMIN_API_KEY` from `.env`) rather than by regular login — there is
no user yet to log in as at this point.

```bash
curl -s -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "X-Platform-Admin-Key: <value you put in apps/api/.env PLATFORM_ADMIN_API_KEY>" \
  -d '{
    "name": "مدرسة النور الأهلية",
    "slug": "al-noor-demo",
    "owner": {
      "fullName": "أحمد الجبوري",
      "email": "admin@alnoor-demo.iq",
      "password": "Passw0rd!23"
    }
  }'
```

Response shape (`TenantsService.createSchool`):

```json
{
  "school": { "id": "<SCHOOL_UUID>", "name": "...", "slug": "al-noor-demo", "...": "..." },
  "owner": { "id": "<USER_UUID>", "fullName": "أحمد الجبوري" }
}
```

**Copy `school.id`** — every subsequent request (including login) needs it as
`X-Tenant-Id`.

**Demo credentials created above** (adjust if you used different values):

- Identifier (email): `admin@alnoor-demo.iq`
- Password: `Passw0rd!23`
- Tenant/School id: `<SCHOOL_UUID from the response above>`

## 5. Verify login + students over curl (the real e2e check)

```bash
SCHOOL_ID="<paste the school.id from step 4>"

# Login
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $SCHOOL_ID" \
  -d '{"identifier":"admin@alnoor-demo.iq","password":"Passw0rd!23"}'
# -> { "accessToken": "...", "refreshToken": "...", "expiresIn": "15m", "user": {...} }

ACCESS_TOKEN="<paste accessToken>"

# Students list (will be an empty items[] — no students created yet, that's expected)
curl -s "http://localhost:3001/api/v1/students?page=1&pageSize=20" \
  -H "X-Tenant-Id: $SCHOOL_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# -> { "items": [], "page": 1, "pageSize": 20, "total": 0, "totalPages": 1 }

# Search (same shape, empty is still expected with no seeded students)
curl -s "http://localhost:3001/api/v1/students?search=test" \
  -H "X-Tenant-Id: $SCHOOL_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

If you want a non-empty list, create a student first (requires
`students.write`, which the `owner` role has by default —
`rbac/default-roles.ts`):

```bash
curl -s -X POST http://localhost:3001/api/v1/students \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $SCHOOL_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"studentNumber":"2026-0001","fullName":"علي حسين الكناني","gender":"MALE"}'
```

## 6. Configure and start apps/web

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local`:

```
API_URL="http://localhost:3001"
DEV_TENANT_ID="<the school.id from step 4>"
```

```bash
pnpm dev
# Next.js on http://localhost:3000
```

Open `http://localhost:3000/login` and sign in with the demo credentials
from step 4. On success you land on `/dashboard`; `/students` fetches the
real list from `apps/api` (search box + prev/next pagination wired to the
`page`/`search` URL params, matching `PaginationQueryDto` exactly).

## What to expect on the students page today

`StudentsService.list()` (`apps/api/src/students/students.service.ts`) does a
bare `findMany` with no `include` — it returns `Student` scalars only
(`fullName`, `studentNumber`, `dateOfBirth`, `gender`, `isActive`, ...). The
web app's table was built against exactly those fields (name + registry no.,
gender, date of birth, active/inactive). It does **not** show section or
guardian phone, because those live on `Enrollment`/`StudentGuardian` relations
the current endpoint doesn't join — see docs/PROGRESS.md's "API changes
needed" note.

## Known local-dev limitation (not a bug, a Next.js constraint)

Next.js only allows cookie mutation (writing the refreshed access/refresh
token cookies back to the browser) from Middleware, a Server Action, or a
Route Handler — never during a plain Server Component render. `apps/web`
handles the real refresh flow **proactively in `middleware.ts`** (which can
write response cookies) before a protected page ever renders; `apiFetch`'s
reactive 401-refresh-and-retry (`src/lib/api/client.ts`) is a same-request
fallback for the rare case a token expires in the few minutes between
middleware and the actual data fetch — if it fires from inside a Server
Component render, the freshly issued token is used for that one request but
can't be persisted to the browser (Next.js throws on cookie writes there), so
a subsequent navigation may need one more sign-in. Full rationale in
`src/middleware.ts` and `src/lib/api/client.ts`'s doc comments.
