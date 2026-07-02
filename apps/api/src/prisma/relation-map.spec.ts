import { buildRelationMap } from './relation-map';

describe('buildRelationMap', () => {
  it('maps relation (object-kind) fields to their related model and list-ness, ignoring scalars', () => {
    const map = buildRelationMap([
      {
        name: 'Student',
        fields: [
          { name: 'id', kind: 'scalar', type: 'String', isList: false },
          { name: 'tenantId', kind: 'scalar', type: 'String', isList: false },
          { name: 'enrollments', kind: 'object', type: 'Enrollment', isList: true },
          { name: 'school', kind: 'object', type: 'School', isList: false },
        ],
      },
      {
        name: 'Enrollment',
        fields: [
          { name: 'id', kind: 'scalar', type: 'String', isList: false },
          { name: 'student', kind: 'object', type: 'Student', isList: false },
        ],
      },
    ]);

    expect(map.Student.enrollments).toEqual({ relatedModel: 'Enrollment', isList: true });
    expect(map.Student.school).toEqual({ relatedModel: 'School', isList: false });
    expect(map.Student.id).toBeUndefined();
    expect(map.Student.tenantId).toBeUndefined();
    expect(map.Enrollment.student).toEqual({ relatedModel: 'Student', isList: false });
  });

  it('returns an empty map for no models and empty field maps for models without relations', () => {
    expect(buildRelationMap([])).toEqual({});
    const map = buildRelationMap([{ name: 'Permission', fields: [{ name: 'id', kind: 'scalar', type: 'String', isList: false }] }]);
    expect(map.Permission).toEqual({});
  });
});
