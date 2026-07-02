import { TenantContextMissingError } from '../common/tenant-context/tenant-context';
import { isTenantScopedModel } from './tenant-scoped-models';
import type { RelationMap } from './relation-map';

/**
 * Pure, framework-agnostic core of the multi-tenant guarantee.
 *
 * Nothing in this file touches a live database or Nest — it only mutates
 * Prisma query `args` objects. That is deliberate: it is the one piece of
 * the codebase where a bug means cross-tenant data leakage, so it needs to
 * be trivially unit-testable without spinning up Postgres or Nest DI.
 *
 * Wired into a real Prisma Client via `$extends` in
 * src/prisma/tenant-scoping.extension.ts.
 */

const CREATE_OPS = new Set(['create']);
const CREATE_MANY_OPS = new Set(['createMany', 'createManyAndReturn']);
// These have both a `where` (scoped like any read/delete) AND a `data` payload
// that must never be allowed to reassign `tenantId` — see UPDATE_OPS handling.
const UPDATE_OPS = new Set(['update', 'updateMany', 'updateManyAndReturn']);
const WHERE_ONLY_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'findMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);
const UPSERT_OP = 'upsert';

export interface ApplyTenantScopeParams {
  model: string | undefined;
  operation: string;
  args: unknown;
  tenantId: string | undefined;
  relationMap?: RelationMap;
}

/**
 * Mutates (returns a new copy of) the args for a single Prisma operation so
 * that it can only ever touch rows belonging to `tenantId`.
 *
 * - Platform-level models (not in TENANT_SCOPED_MODELS) pass through untouched.
 * - Tenant-scoped models REQUIRE a tenantId — missing context throws
 *   TenantContextMissingError rather than silently running an unscoped query.
 * - Reads/updates/deletes: `where.tenantId` is forcibly set to the context
 *   value, overriding anything the caller passed — a caller cannot escape
 *   its tenant even by accident or malice.
 * - Creates: `data.tenantId` is forcibly stamped, so a row can never be
 *   created in the wrong tenant even if `data` came from unchecked input.
 * - Updates/upsert-update: `tenantId` is stripped from `data` entirely — a
 *   row can never be *reassigned* to a different tenant via update, only
 *   ever read/written within the tenant it already belongs to.
 * - Nested relation writes (e.g. `student.create({ data: { enrollments:
 *   { create: {...} } } })`) are walked recursively via `relationMap` so
 *   nested tenant-scoped rows get stamped too — Prisma's `$allOperations`
 *   hook only sees the top-level call, not nested writes.
 */
export function applyTenantScope(params: ApplyTenantScopeParams): unknown {
  const { model, operation, tenantId, relationMap } = params;
  let args = (params.args ?? {}) as Record<string, unknown>;

  if (!isTenantScopedModel(model)) {
    return params.args;
  }

  if (!tenantId) {
    throw new TenantContextMissingError(model);
  }

  if (CREATE_OPS.has(operation)) {
    const data = stampCreateData(args.data, tenantId, model, relationMap);
    args = { ...args, data };
  } else if (CREATE_MANY_OPS.has(operation)) {
    const rows = Array.isArray(args.data) ? args.data : [args.data];
    args = {
      ...args,
      data: rows.map((row) => stampCreateData(row, tenantId, model, relationMap)),
    };
  } else if (operation === UPSERT_OP) {
    const create = stampCreateData(args.create, tenantId, model, relationMap);
    const update = { ...(args.update as Record<string, unknown> | undefined) };
    delete update.tenantId; // tenantId must never be changed by an update
    args = {
      ...args,
      where: { ...(args.where as Record<string, unknown> | undefined), tenantId },
      create,
      update,
    };
  } else if (UPDATE_OPS.has(operation)) {
    const data = { ...(args.data as Record<string, unknown> | undefined) };
    delete data.tenantId; // a row can never be reassigned to a different tenant via update
    args = {
      ...args,
      where: { ...(args.where as Record<string, unknown> | undefined), tenantId },
      data,
    };
  } else if (WHERE_ONLY_OPS.has(operation)) {
    args = { ...args, where: { ...(args.where as Record<string, unknown> | undefined), tenantId } };
  }

  return args;
}

function stampCreateData(
  data: unknown,
  tenantId: string,
  model: string,
  relationMap: RelationMap | undefined,
): unknown {
  if (data == null || typeof data !== 'object') {
    return data;
  }
  const stamped: Record<string, unknown> = { ...(data as Record<string, unknown>), tenantId };
  if (relationMap) {
    injectNestedTenantIds(model, stamped, tenantId, relationMap);
  }
  return stamped;
}

/**
 * Recursively walks the relation fields of a `create`-shaped payload and
 * stamps `tenantId` onto any nested `create` / `createMany.data` /
 * `connectOrCreate[].create` blocks whose related model is tenant-scoped.
 * Mutates `obj` in place (called only on objects we already own a fresh
 * shallow copy of — see `stampCreateData`).
 */
export function injectNestedTenantIds(
  model: string,
  obj: Record<string, unknown>,
  tenantId: string,
  relationMap: RelationMap,
): void {
  const relations = relationMap[model];
  if (!relations) return;

  for (const [field, relation] of Object.entries(relations)) {
    const value = obj[field];
    if (value == null || typeof value !== 'object') continue;
    if (!isTenantScopedModel(relation.relatedModel)) continue;

    const nested = { ...(value as Record<string, unknown>) };

    if ('create' in nested) {
      nested.create = stampNestedCreate(relation.relatedModel, nested.create, tenantId, relationMap);
    }
    if ('createMany' in nested && nested.createMany && typeof nested.createMany === 'object') {
      const createMany = nested.createMany as Record<string, unknown>;
      const rows = Array.isArray(createMany.data) ? createMany.data : [createMany.data];
      nested.createMany = {
        ...createMany,
        data: rows.map((row) => stampNestedCreate(relation.relatedModel, row, tenantId, relationMap)),
      };
    }
    if ('connectOrCreate' in nested) {
      // connectOrCreate is a single object for to-one relations and can be
      // either a single object or an array for to-many relations — the
      // shape must round-trip unchanged, so normalize only for iteration.
      const wasArray = Array.isArray(nested.connectOrCreate);
      const entries: unknown[] = wasArray ? (nested.connectOrCreate as unknown[]) : [nested.connectOrCreate];
      const mapped = entries.map((entry: unknown) => {
        if (entry == null || typeof entry !== 'object') return entry;
        const e = { ...(entry as Record<string, unknown>) };
        if ('create' in e) {
          e.create = stampNestedCreate(relation.relatedModel, e.create, tenantId, relationMap);
        }
        return e;
      });
      nested.connectOrCreate = wasArray ? mapped : mapped[0];
    }

    obj[field] = nested;
  }
}

function stampNestedCreate(
  relatedModel: string,
  data: unknown,
  tenantId: string,
  relationMap: RelationMap,
): unknown {
  if (Array.isArray(data)) {
    return data.map((row) => stampNestedCreate(relatedModel, row, tenantId, relationMap));
  }
  if (data == null || typeof data !== 'object') return data;
  const stamped: Record<string, unknown> = { ...(data as Record<string, unknown>), tenantId };
  injectNestedTenantIds(relatedModel, stamped, tenantId, relationMap);
  return stamped;
}
