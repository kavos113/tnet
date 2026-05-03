import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { ensureSqliteColumn, openSqliteDatabase } from './sqlite';

const tempDirs: string[] = [];

const createTempDir = (): string => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-sqlite-'));
  tempDirs.push(tempDir);
  return tempDir;
};

describe('sqlite storage helpers', () => {
  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('opens a database, applies pragmas, and executes schema callbacks in order', () => {
    const calls: string[] = [];
    const databasePath = path.join(createTempDir(), 'nested', 'test.db');
    const database = openSqliteDatabase({
      databasePath,
      schemaSql: 'CREATE TABLE items (id TEXT PRIMARY KEY);',
      beforeSchema: () => calls.push('before'),
      afterSchema: () => calls.push('after')
    });

    expect(calls).toEqual(['before', 'after']);
    expect(
      database.prepare("SELECT name FROM sqlite_master WHERE name = 'items'").get()
    ).toBeTruthy();
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);

    database.close();
  });

  it('adds missing columns once', () => {
    const database = openSqliteDatabase({
      databasePath: path.join(createTempDir(), 'test.db'),
      schemaSql: 'CREATE TABLE items (id TEXT PRIMARY KEY);'
    });

    ensureSqliteColumn(database, 'items', 'name', 'name TEXT');
    ensureSqliteColumn(database, 'items', 'name', 'name TEXT');

    const columns = database.pragma('table_info(items)') as Array<{ name: string }>;
    expect(columns.filter((column) => column.name === 'name')).toHaveLength(1);

    database.close();
  });
});
