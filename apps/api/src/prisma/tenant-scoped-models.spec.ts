import { TENANT_SCOPED_MODELS, isTenantScopedModel } from './tenant-scoped-models';

describe('isTenantScopedModel', () => {
  it.each(TENANT_SCOPED_MODELS)('returns true for tenant-scoped model %s', (model) => {
    expect(isTenantScopedModel(model)).toBe(true);
  });

  it.each(['Organization', 'School', 'User', 'Permission', 'RefreshToken'])(
    'returns false for platform-level model %s',
    (model) => {
      expect(isTenantScopedModel(model)).toBe(false);
    },
  );

  it('returns false for undefined/null/empty', () => {
    expect(isTenantScopedModel(undefined)).toBe(false);
    expect(isTenantScopedModel(null)).toBe(false);
    expect(isTenantScopedModel('')).toBe(false);
  });
});
