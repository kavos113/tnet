import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDbInspectorDatabase, type DbInspectorDatabase } from './dbInspectorDb';
import { QueryHistoryRepository } from './queryHistoryRepository';
import { QueryTabRepository } from './queryTabRepository';
import { SchemaCacheRepository } from './schemaCacheRepository';
import { WorkspaceRepository } from './workspaceRepository';

describe('WorkspaceRepository', () => {
  let database: DbInspectorDatabase | undefined;
  let tempDir: string | undefined;

  afterEach(() => {
    database?.close();
    database = undefined;
    if (tempDir) fs.rmSync(tempDir, { force: true, recursive: true });
    tempDir = undefined;
  });

  it('deletes tabs, history, and schema cache through foreign key cascade', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-db-inspector-'));
    database = openDbInspectorDatabase(tempDir);
    const workspaceRepository = new WorkspaceRepository(database);
    const tabRepository = new QueryTabRepository(database);
    const historyRepository = new QueryHistoryRepository(database);
    const schemaRepository = new SchemaCacheRepository(database);

    const workspace = workspaceRepository.create({
      name: 'Local',
      connection: {
        driver: 'sqlite',
        databasePath: path.join(tempDir, 'local.db'),
        readOnly: true
      }
    });
    tabRepository.save({
      workspaceId: workspace.id,
      title: 'Query',
      sqlText: 'SELECT 1'
    });
    historyRepository.save({
      workspaceId: workspace.id,
      sqlText: 'SELECT 1',
      startedAt: new Date().toISOString(),
      durationMs: 1,
      rowCount: 1
    });
    schemaRepository.save(workspace.id, { schemas: [], refreshedAt: new Date().toISOString() });

    workspaceRepository.remove(workspace.id);

    expect(workspaceRepository.get(workspace.id)).toBeNull();
    expect(tabRepository.list(workspace.id)).toEqual([]);
    expect(historyRepository.list(workspace.id)).toEqual([]);
    expect(schemaRepository.get(workspace.id)).toBeNull();
  });
});
