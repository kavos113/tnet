import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SqliteDriver } from './sqliteDriver';
import type { DbInspectorSqliteConnection } from '@tnet/app-db-inspector/shared/dbInspectorTypes';

describe('SqliteDriver', () => {
  let tempDir: string;
  let databasePath: string;
  let connection: DbInspectorSqliteConnection;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-db-inspector-'));
    databasePath = path.join(tempDir, 'test.db');
    const database = new Database(databasePath);
    database.exec(`
      CREATE TABLE authors (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE papers (
        id INTEGER PRIMARY KEY,
        author_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        FOREIGN KEY (author_id) REFERENCES authors(id)
      );
      INSERT INTO authors (name) VALUES ('Ada'), ('Grace');
      INSERT INTO papers (author_id, title) VALUES (1, 'Compiler Notes'), (2, 'Debugging Notes');
    `);
    database.close();
    connection = { driver: 'sqlite', databasePath, readOnly: true };
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('introspects tables, columns, primary keys and foreign keys', async () => {
    const snapshot = await new SqliteDriver().introspect(connection);

    expect(snapshot.schemas[0].tables.map((table) => table.name)).toEqual(['authors', 'papers']);
    expect(snapshot.schemas[0].tables[0].primaryKey).toEqual(['id']);
    expect(snapshot.schemas[0].tables[1].foreignKeys).toEqual([
      {
        columns: ['author_id'],
        referencedTableName: 'authors',
        referencedColumns: ['id']
      }
    ]);
  });

  it('loads paged table data with a simple filter', async () => {
    const result = await new SqliteDriver().loadTablePage(connection, {
      workspaceId: 'workspace-1',
      tableName: 'papers',
      page: 0,
      pageSize: 1,
      filter: 'Debugging'
    });

    expect(result.totalRows).toBe(1);
    expect(result.rows).toEqual([{ id: 2, author_id: 2, title: 'Debugging Notes' }]);
  });

  it('loads paged table data with a SQL where clause', async () => {
    const result = await new SqliteDriver().loadTablePage(connection, {
      workspaceId: 'workspace-1',
      tableName: 'papers',
      page: 0,
      pageSize: 10,
      whereClause: 'author_id = 1'
    });

    expect(result.totalRows).toBe(1);
    expect(result.rows).toEqual([{ id: 1, author_id: 1, title: 'Compiler Notes' }]);
  });

  it('rejects mutating queries in read-only mode', async () => {
    await expect(
      new SqliteDriver().executeQuery(
        { ...connection, readOnly: false },
        { workspaceId: 'workspace-1', sqlText: "DELETE FROM authors WHERE name = 'Ada'" },
        true
      )
    ).rejects.toThrow(/Read-only mode/);
  });

  it('explains read-only queries with SQLite query plan rows', async () => {
    const result = await new SqliteDriver().explainQuery(connection, {
      workspaceId: 'workspace-1',
      sqlText: 'SELECT * FROM papers WHERE author_id = 1'
    });

    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.rawText).toContain('papers');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects mutating query explain requests', async () => {
    await expect(
      new SqliteDriver().explainQuery(connection, {
        workspaceId: 'workspace-1',
        sqlText: "DELETE FROM authors WHERE name = 'Ada'"
      })
    ).rejects.toThrow(/read-only SQL/);
  });
});
