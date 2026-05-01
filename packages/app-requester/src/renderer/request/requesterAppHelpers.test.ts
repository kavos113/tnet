import { describe, expect, it, vi } from 'vitest';
import {
  buildGraphqlSchemaSummary,
  createEmptyRow,
  stringifyErrorValue,
  toExecutionErrorSnapshot,
  updateKeyValueRow
} from './requesterAppHelpers';

describe('requesterAppHelpers', () => {
  it('creates enabled empty rows with generated ids', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');

    expect(createEmptyRow()).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      enabled: true,
      key: '',
      value: ''
    });
  });

  it('updates only the matching key-value row', () => {
    const rows = [
      { id: 'a', enabled: true, key: 'Accept', value: 'json' },
      { id: 'b', enabled: true, key: 'Authorization', value: 'token' }
    ];

    expect(updateKeyValueRow(rows, 'b', { enabled: false, value: '' })).toEqual([
      rows[0],
      { id: 'b', enabled: false, key: 'Authorization', value: '' }
    ]);
  });

  it('stringifies unknown error values', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(stringifyErrorValue(undefined)).toBeUndefined();
    expect(stringifyErrorValue(new Error('failed'))).toBe('failed');
    expect(stringifyErrorValue('plain')).toBe('plain');
    expect(stringifyErrorValue({ code: 'E_TEST' })).toBe('{"code":"E_TEST"}');
    expect(stringifyErrorValue(circular)).toBe('[object Object]');
  });

  it('creates serializable execution error snapshots', () => {
    const cause = { code: 'CAUSE' };
    const error = new Error('boom', { cause });
    error.name = '';

    expect(toExecutionErrorSnapshot(error)).toMatchObject({
      name: 'Error',
      message: 'boom',
      cause: '{"code":"CAUSE"}'
    });
    expect(toExecutionErrorSnapshot(null)).toEqual({
      name: 'Error',
      message: 'Request execution failed.'
    });
  });

  it('summarizes GraphQL schema types and filters internal types', () => {
    const summary = buildGraphqlSchemaSummary(
      JSON.stringify({
        data: {
          __schema: {
            types: [
              { name: '__Schema', kind: 'OBJECT', fields: [{}] },
              { name: 'Query', kind: 'OBJECT', fields: [{}, {}] },
              { name: 'Role', kind: 'ENUM', enumValues: [{}, {}, {}] },
              { name: 'UserInput', kind: 'INPUT_OBJECT', inputFields: [{}] },
              { name: 123, kind: 'OBJECT' }
            ]
          }
        }
      })
    );

    expect(summary).toEqual([
      { name: 'Query', kind: 'OBJECT', fieldCount: 2 },
      { name: 'Role', kind: 'ENUM', fieldCount: 3 },
      { name: 'UserInput', kind: 'INPUT_OBJECT', fieldCount: 1 }
    ]);
    expect(buildGraphqlSchemaSummary('{"data":{}}')).toEqual([]);
  });
});
