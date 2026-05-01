import type { DatabaseSchemaSnapshot } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorDatabase } from './dbInspectorDb';

export class SchemaCacheRepository {
  constructor(private readonly database: DbInspectorDatabase) {}

  get(workspaceId: string): DatabaseSchemaSnapshot | null {
    const row = this.database
      .prepare('SELECT schema_json FROM schema_cache WHERE workspace_id = ?')
      .get(workspaceId) as { schema_json: string } | undefined;
    return row ? (JSON.parse(row.schema_json) as DatabaseSchemaSnapshot) : null;
  }

  save(workspaceId: string, snapshot: DatabaseSchemaSnapshot): void {
    this.database
      .prepare(
        `INSERT INTO schema_cache (workspace_id, schema_json, refreshed_at)
         VALUES (?, ?, ?)
         ON CONFLICT(workspace_id) DO UPDATE SET
           schema_json = excluded.schema_json,
           refreshed_at = excluded.refreshed_at`
      )
      .run(workspaceId, JSON.stringify(snapshot), snapshot.refreshedAt);
  }
}
