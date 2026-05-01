import type { DbInspectorDatabase } from './dbInspectorDb';

export class QueryTabRepository {
  constructor(private readonly database: DbInspectorDatabase) {}

  count(workspaceId: string): number {
    const row = this.database
      .prepare('SELECT COUNT(*) AS count FROM query_tabs WHERE workspace_id = ?')
      .get(workspaceId) as { count: number };
    return row.count;
  }
}
