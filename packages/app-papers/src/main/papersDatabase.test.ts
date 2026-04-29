// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { openPapersDatabase, readPapersSchemaSql, type PapersDatabase } from './papersDatabase';
import { papersDataDir, papersDatabasePath, papersSettingsPath } from './papersPaths';

const tempDir = async (): Promise<string> => fs.mkdtemp(path.join(os.tmpdir(), 'tnet-papers-db-'));

describe('papersDatabase', () => {
  let database: PapersDatabase | null = null;

  afterEach(() => {
    database?.close();
    database = null;
  });

  it('keeps schema in a sql file', async () => {
    const schema = await readPapersSchemaSql();

    expect(schema).toContain('CREATE TABLE IF NOT EXISTS papers');
    expect(schema).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS paper_search');
  });

  it('creates papers.db in the same directory as paper settings', async () => {
    const root = await tempDir();

    database = await openPapersDatabase(root);

    expect(papersDatabasePath(root)).toBe(path.join(papersDataDir(root), 'papers.db'));
    expect(path.dirname(papersDatabasePath(root))).toBe(path.dirname(papersSettingsPath(root)));
    await expect(fs.stat(papersDatabasePath(root))).resolves.toMatchObject({});
  });

  it('applies the initial schema migration', async () => {
    const root = await tempDir();

    database = await openPapersDatabase(root);

    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'virtual table')")
      .all()
      .map((row) => (row as { name: string }).name);
    expect(tables).toContain('papers');
    expect(tables).toContain('paper_authors');
    expect(tables).toContain('tags');
    expect(tables).toContain('paper_tags');
    expect(tables).toContain('notes');
    expect(tables).toContain('paper_search');
    expect(database.prepare('SELECT version FROM papers_schema_migrations').all()).toMatchObject([
      { version: 1 }
    ]);
  });
});
