import { randomUUID } from 'node:crypto';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import {
  defaultRequesterWorkspaceSettings,
  normalizeRequesterWorkspaceSettings
} from '@tnet/app-requester/shared/config';
import type { RequesterWorkspace } from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterDatabase } from './requesterDb';

interface WorkspaceRow {
  id: string;
  name: string;
  settings_json: string;
}

const toWorkspace = (row: WorkspaceRow): RequesterWorkspace => ({
  id: row.id,
  name: row.name
});

const parseSettings = (settingsJson: string): RequesterWorkspaceSettings =>
  normalizeRequesterWorkspaceSettings(
    JSON.parse(settingsJson) as Partial<RequesterWorkspaceSettings>
  );

export class WorkspaceRepository {
  constructor(private readonly database: RequesterDatabase) {}

  list(): RequesterWorkspace[] {
    const rows = this.database
      .prepare('SELECT id, name, settings_json FROM workspaces ORDER BY updated_at DESC, name ASC')
      .all() as WorkspaceRow[];
    return rows.map(toWorkspace);
  }

  create(name: string): RequesterWorkspace {
    const now = new Date().toISOString();
    const workspace: RequesterWorkspace = {
      id: randomUUID(),
      name: name.trim() || 'Untitled Workspace'
    };
    this.database
      .prepare(
        `INSERT INTO workspaces (id, name, settings_json, created_at, updated_at)
         VALUES (@id, @name, @settingsJson, @createdAt, @updatedAt)`
      )
      .run({
        id: workspace.id,
        name: workspace.name,
        settingsJson: JSON.stringify(defaultRequesterWorkspaceSettings()),
        createdAt: now,
        updatedAt: now
      });
    return workspace;
  }

  update(workspaceId: string, name: string): RequesterWorkspace {
    const now = new Date().toISOString();
    this.database
      .prepare('UPDATE workspaces SET name = ?, updated_at = ? WHERE id = ?')
      .run(name.trim() || 'Untitled Workspace', now, workspaceId);
    const workspace = this.get(workspaceId);
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
    return workspace;
  }

  remove(workspaceId: string): void {
    this.database.prepare('DELETE FROM workspaces WHERE id = ?').run(workspaceId);
  }

  get(workspaceId: string): RequesterWorkspace | null {
    const row = this.database
      .prepare('SELECT id, name, settings_json FROM workspaces WHERE id = ?')
      .get(workspaceId) as WorkspaceRow | undefined;
    return row ? toWorkspace(row) : null;
  }

  getSettings(workspaceId: string): RequesterWorkspaceSettings {
    const row = this.database
      .prepare('SELECT id, name, settings_json FROM workspaces WHERE id = ?')
      .get(workspaceId) as WorkspaceRow | undefined;
    if (!row) return defaultRequesterWorkspaceSettings();
    return parseSettings(row.settings_json);
  }

  saveSettings(workspaceId: string, settings: RequesterWorkspaceSettings): void {
    this.database
      .prepare('UPDATE workspaces SET settings_json = ?, updated_at = ? WHERE id = ?')
      .run(
        JSON.stringify(normalizeRequesterWorkspaceSettings(settings)),
        new Date().toISOString(),
        workspaceId
      );
  }
}
