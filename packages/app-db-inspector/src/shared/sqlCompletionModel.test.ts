import { describe, expect, it } from 'vitest';
import type { DatabaseSchemaSnapshot } from './dbInspectorTypes';
import { buildSqlCompletionItems, getSqlCompletionContext } from './sqlCompletionModel';

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
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false },
            { name: 'name', type: 'TEXT', nullable: false }
          ],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: []
        },
        {
          schemaName: 'main',
          name: 'papers',
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false },
            { name: 'author_id', type: 'INTEGER', nullable: false },
            { name: 'paper title', type: 'TEXT', nullable: false }
          ],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: []
        }
      ]
    }
  ]
};

describe('sqlCompletionModel', () => {
  it('detects table completion after FROM', () => {
    const context = getSqlCompletionContext('SELECT * FROM pa', 'SELECT * FROM pa'.length);

    expect(context).toMatchObject({ kind: 'table', prefix: 'pa' });
    expect(
      buildSqlCompletionItems({ context, dialect: 'sqlite', schema }).map((item) => item.label)
    ).toEqual(['papers']);
  });

  it('detects column completion after WHERE', () => {
    const context = getSqlCompletionContext(
      'SELECT * FROM papers WHERE au',
      'SELECT * FROM papers WHERE au'.length
    );

    expect(context.kind).toBe('column');
    expect(
      buildSqlCompletionItems({ context, dialect: 'sqlite', schema }).map((item) => item.label)
    ).toContain('author_id');
  });

  it('uses table aliases for qualified column completion', () => {
    const sql = 'SELECT * FROM papers p WHERE p.';
    const context = getSqlCompletionContext(sql, sql.length);

    expect(context).toMatchObject({ kind: 'column', qualifier: 'p', aliases: { p: 'papers' } });
    expect(
      buildSqlCompletionItems({ context, dialect: 'sqlite', schema }).map((item) => item.label)
    ).toEqual(['id', 'author_id', 'paper title']);
  });

  it('quotes inserted identifiers for the active dialect', () => {
    const context = getSqlCompletionContext('SELECT paper', 'SELECT paper'.length);
    const item = buildSqlCompletionItems({ context, dialect: 'mysql', schema }).find(
      (candidate) => candidate.label === 'paper title'
    );

    expect(item?.apply).toBe('`paper title`');
  });

  it('falls back to keyword completion without schema', () => {
    const context = getSqlCompletionContext('SEL', 3);

    expect(
      buildSqlCompletionItems({ context, dialect: 'sqlite' }).map((item) => item.label)
    ).toContain('SELECT');
  });
});
