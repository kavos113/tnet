import type { DbInspectorDatabase } from './dbInspectorDb';

export class SavedQueryRepository {
  constructor(private readonly database: DbInspectorDatabase) {}

  count(workspaceId: string): number {
    const row = this.database
      .prepare('SELECT COUNT(*) AS count FROM saved_queries WHERE workspace_id = ?')
      .get(workspaceId) as { count: number };
    return row.count;
  }
}
