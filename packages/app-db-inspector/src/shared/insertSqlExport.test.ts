import { describe, expect, it } from 'vitest';
import type { DatabaseColumn } from './dbInspectorTypes';
import { quoteIdentifier, rowsToInsertSql, toSqlLiteral } from './insertSqlExport';

const columns: DatabaseColumn[] = [
  { name: 'id', type: 'INTEGER', nullable: false },
  { name: 'title', type: 'TEXT', nullable: false },
  { name: 'published', type: 'BOOLEAN', nullable: true }
];

describe('insertSqlExport', () => {
  it('exports rows as a multi-row SQLite insert statement', () => {
    expect(
      rowsToInsertSql({
        dialect: 'sqlite',
        tableName: 'papers',
        columns,
        rows: [
          { id: 1, title: "Ada's notes", published: true },
          { id: 2, title: 'Compiler, design', published: null }
        ]
      })
    ).toBe(
      `INSERT INTO "papers" ("id", "title", "published") VALUES\n  (1, 'Ada''s notes', TRUE),\n  (2, 'Compiler, design', NULL);`
    );
  });

  it('exports rows as one statement per row', () => {
    expect(
      rowsToInsertSql({
        dialect: 'postgresql',
        schemaName: 'public',
        tableName: 'papers',
        columns: columns.slice(0, 2),
        rows: [{ id: 1, title: 'A' }],
        mode: 'one-row-per-statement'
      })
    ).toBe(`INSERT INTO "public"."papers" ("id", "title") VALUES (1, 'A');`);
  });

  it('quotes MySQL identifiers with backticks', () => {
    expect(quoteIdentifier('mysql', 'has`tick')).toBe('`has``tick`');
  });

  it('escapes scalar SQL literals', () => {
    expect(toSqlLiteral("can't", 'sqlite')).toBe("'can''t'");
    expect(toSqlLiteral(undefined, 'sqlite')).toBe('NULL');
    expect(toSqlLiteral({ nested: true }, 'sqlite')).toBe(`'{"nested":true}'`);
  });

  it('exports binary literals per dialect', () => {
    expect(toSqlLiteral(new Uint8Array([0, 255]), 'sqlite')).toBe("X'00ff'");
    expect(toSqlLiteral(new Uint8Array([0, 255]), 'postgresql')).toBe("decode('00ff', 'hex')");
  });
});
