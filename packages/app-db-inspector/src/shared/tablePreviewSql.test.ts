import { describe, expect, it } from 'vitest';
import type { DatabaseTable } from './dbInspectorTypes';
import { buildTablePreviewSql, parseTablePreviewSql } from './tablePreviewSql';

const table: DatabaseTable = {
  schemaName: 'main',
  name: 'papers',
  columns: [
    { name: 'id', type: 'INTEGER', nullable: false },
    { name: 'title', type: 'TEXT', nullable: false }
  ],
  primaryKey: ['id'],
  foreignKeys: [],
  indexes: []
};

describe('tablePreviewSql', () => {
  it('builds table preview SQL with order by', () => {
    expect(buildTablePreviewSql(table, { column: 'title', direction: 'desc' })).toBe(
      'SELECT * FROM "papers" ORDER BY "title" DESC'
    );
  });

  it('parses where and order by clauses', () => {
    expect(
      parseTablePreviewSql('SELECT * FROM "papers" WHERE id > 1 ORDER BY "title" DESC', table)
    ).toEqual({
      whereClause: 'id > 1',
      sort: { column: 'title', direction: 'desc' }
    });
  });

  it('rejects non-select preview SQL', () => {
    expect(() => parseTablePreviewSql('DELETE FROM papers', table)).toThrow(/SELECT/);
  });
});
