import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import type { DatabaseSchemaSnapshot } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { createSqlCompletionSource } from './sqlCompletion';

const schema: DatabaseSchemaSnapshot = {
  refreshedAt: '2026-01-01T00:00:00.000Z',
  schemas: [
    {
      name: 'main',
      views: [],
      tables: [
        {
          schemaName: 'main',
          name: 'authors',
          columns: [{ name: 'name', type: 'TEXT', nullable: true }],
          primaryKey: [],
          foreignKeys: [],
          indexes: []
        }
      ]
    }
  ]
};

const complete = async (doc: string, explicit = false) =>
  Promise.resolve(
    createSqlCompletionSource({ dialect: 'sqlite', schema })(
      new CompletionContext(EditorState.create({ doc }), doc.length, explicit)
    )
  );

describe('sqlCompletion', () => {
  it('returns null for implicit completion with no prefix', async () => {
    await expect(complete('SELECT ', false)).resolves.toBeNull();
  });

  it('returns keyword and schema options for explicit completion', async () => {
    const result = await complete('', true);

    expect(result?.from).toBe(0);
    expect(result?.options.map((option) => option.label)).toEqual(
      expect.arrayContaining(['SELECT', 'authors', 'name'])
    );
  });

  it('returns table options in FROM context', async () => {
    const result = await complete('SELECT * FROM au');

    expect(result?.from).toBe('SELECT * FROM '.length);
    expect(result?.options).toEqual([
      expect.objectContaining({ label: 'authors', type: 'table', detail: 'main' })
    ]);
  });
});
