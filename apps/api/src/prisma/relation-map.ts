/**
 * Minimal shape of the pieces of Prisma's DMMF we actually need, so this
 * module has zero dependency on a generated @prisma/client and can be unit
 * tested with plain fixtures.
 */
export interface DmmfFieldLike {
  name: string;
  kind: string; // 'object' for relation fields
  type: string; // related model name when kind === 'object'
  isList: boolean;
}

export interface DmmfModelLike {
  name: string;
  fields: readonly DmmfFieldLike[];
}

export interface RelationInfo {
  relatedModel: string;
  isList: boolean;
}

/** modelName -> relationFieldName -> info about the related model */
export type RelationMap = Record<string, Record<string, RelationInfo>>;

/**
 * Builds a model -> relation-field -> related-model lookup from Prisma's
 * DMMF datamodel. Used to walk nested `create`/`createMany`/`connectOrCreate`
 * payloads and stamp `tenantId` onto tenant-scoped relations that Prisma's
 * top-level query extension cannot see (nested writes are invisible to
 * `$allOperations` — see tenant-scoping.ts).
 */
export function buildRelationMap(models: readonly DmmfModelLike[]): RelationMap {
  const map: RelationMap = {};
  for (const model of models) {
    const fields: Record<string, RelationInfo> = {};
    for (const field of model.fields) {
      if (field.kind === 'object') {
        fields[field.name] = { relatedModel: field.type, isList: field.isList };
      }
    }
    map[model.name] = fields;
  }
  return map;
}
