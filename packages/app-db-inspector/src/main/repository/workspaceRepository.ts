import { randomUUID } from 'node:crypto';
import type {
  DbInspectorConnection,
  DbInspectorWorkspace
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorWorkspaceSettings } from '@tnet/app-db-inspector/shared/config';
import {
  defaultDbInspectorWorkspaceSettings,
  normalizeDbInspectorWorkspaceSettings
} from '@tnet/app-db-inspector/shared/config';
import type { DbInspectorDatabase } from './dbInspectorDb';

interface WorkspaceRow {
  id: string;
  name: string;
  driver: string;
  connection_json: string;
  settings_json: string;
  created_at: string;
  updated_at: string;
}

const parseConnection = (json: string): DbInspectorConnection =>
  JSON.parse(json) as DbInspectorConnection;

const toWorkspace = (row: WorkspaceRow): DbInspectorWorkspace => ({
  id: row.id,
  name: row.name,
  driver: row.driver as DbInspectorWorkspace['driver'],
  connection: parseConnection(row.connection_json),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export class WorkspaceRepository {
  constructor(private readonly database: DbInspectorDatabase) {}

  list(): DbInspectorWorkspace[] {
    const rows = this.database
      .prepare(
        `SELECT id, name, driver, connection_json, settings_json, created_at, updated_at
         FROM workspaces
         ORDER BY updated_at DESC, name ASC`
      )
      .all() as WorkspaceRow[];
    return rows.map(toWorkspace);
  }

  create(input: {
    name: string;
    connection: DbInspectorConnection;
    settings?: DbInspectorWorkspaceSettings;
  }): DbInspectorWorkspace {
    const now = new Date().toISOString();
    const workspace: DbInspectorWorkspace = {
      id: randomUUID(),
      name: input.name.trim() || 'Untitled Database',
      driver: input.connection.driver,
      connection: input.connection,
      createdAt: now,
      updatedAt: now
    };
    this.database
      .prepare(
        `INSERT INTO workspaces (
           id, name, driver, connection_json, settings_json, created_at, updated_at
         ) VALUES (
           @id, @name, @driver, @connectionJson, @settingsJson, @createdAt, @updatedAt
         )`
      )
      .run({
        id: workspace.id,
        name: workspace.name,
        driver: workspace.driver,
        connectionJson: JSON.stringify(workspace.connection),
        settingsJson: JSON.stringify(input.settings ?? defaultDbInspectorWorkspaceSettings()),
        createdAt: now,
        updatedAt: now
      });
    return workspace;
  }

  update(input: {
    workspaceId: string;
    name: string;
    connection: DbInspectorConnection;
  }): DbInspectorWorkspace {
    this.database
      .prepare(
        `UPDATE workspaces
         SET name = ?, driver = ?, connection_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.name.trim() || 'Untitled Database',
        input.connection.driver,
        JSON.stringify(input.connection),
        new Date().toISOString(),
        input.workspaceId
      );
    const workspace = this.get(input.workspaceId);
    if (!workspace) throw new Error(`Workspace not found: ${input.workspaceId}`);
    return workspace;
  }

  remove(workspaceId: string): void {
    this.database.prepare('DELETE FROM workspaces WHERE id = ?').run(workspaceId);
  }

  get(workspaceId: string): DbInspectorWorkspace | null {
    const row = this.database
      .prepare(
        `SELECT id, name, driver, connection_json, settings_json, created_at, updated_at
         FROM workspaces
         WHERE id = ?`
      )
      .get(workspaceId) as WorkspaceRow | undefined;
    return row ? toWorkspace(row) : null;
  }

  getSettings(workspaceId: string): DbInspectorWorkspaceSettings {
    const row = this.database
      .prepare('SELECT settings_json FROM workspaces WHERE id = ?')
      .get(workspaceId) as Pick<WorkspaceRow, 'settings_json'> | undefined;
    if (!row) return defaultDbInspectorWorkspaceSettings();
    return normalizeDbInspectorWorkspaceSettings(
      JSON.parse(row.settings_json) as Partial<DbInspectorWorkspaceSettings>
    );
  }

  saveSettings(workspaceId: string, settings: DbInspectorWorkspaceSettings): void {
    this.database
      .prepare('UPDATE workspaces SET settings_json = ?, updated_at = ? WHERE id = ?')
      .run(
        JSON.stringify(normalizeDbInspectorWorkspaceSettings(settings)),
        new Date().toISOString(),
        workspaceId
      );
  }
}
