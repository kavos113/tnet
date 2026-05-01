import { randomUUID } from 'node:crypto';
import type { QueryTab, SaveQueryTabInput } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorDatabase } from './dbInspectorDb';

interface QueryTabRow {
  id: string;
  workspace_id: string;
  title: string;
  sql_text: string;
  sort_order: number;
  updated_at: string;
}

const toQueryTab = (row: QueryTabRow): QueryTab => ({
  id: row.id,
  workspaceId: row.workspace_id,
  title: row.title,
  sqlText: row.sql_text,
  sortOrder: row.sort_order,
  updatedAt: row.updated_at
});

export class QueryTabRepository {
  constructor(private readonly database: DbInspectorDatabase) {}

  list(workspaceId: string): QueryTab[] {
    const rows = this.database
      .prepare(
        `SELECT id, workspace_id, title, sql_text, sort_order, updated_at
         FROM query_tabs
         WHERE workspace_id = ?
         ORDER BY sort_order ASC, updated_at DESC`
      )
      .all(workspaceId) as QueryTabRow[];
    return rows.map(toQueryTab);
  }

  save(input: SaveQueryTabInput): QueryTab {
    return input.id ? this.update(input) : this.create(input);
  }

  remove(queryTabId: string): void {
    this.database.prepare('DELETE FROM query_tabs WHERE id = ?').run(queryTabId);
  }

  count(workspaceId: string): number {
    const row = this.database
      .prepare('SELECT COUNT(*) AS count FROM query_tabs WHERE workspace_id = ?')
      .get(workspaceId) as { count: number };
    return row.count;
  }

  private create(input: SaveQueryTabInput): QueryTab {
    const id = randomUUID();
    const updatedAt = new Date().toISOString();
    this.database
      .prepare(
        `INSERT INTO query_tabs (id, workspace_id, title, sql_text, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.workspaceId,
        input.title.trim() || 'Query',
        input.sqlText,
        this.nextSortOrder(input.workspaceId),
        updatedAt
      );
    const created = this.get(id);
    if (!created) throw new Error(`Query tab was not created: ${id}`);
    return created;
  }

  private update(input: SaveQueryTabInput): QueryTab {
    if (!input.id) throw new Error('Query tab id is required for update');
    this.database
      .prepare(
        `UPDATE query_tabs
         SET title = ?, sql_text = ?, updated_at = ?
         WHERE id = ? AND workspace_id = ?`
      )
      .run(
        input.title.trim() || 'Query',
        input.sqlText,
        new Date().toISOString(),
        input.id,
        input.workspaceId
      );
    const updated = this.get(input.id);
    if (!updated) throw new Error(`Query tab not found: ${input.id}`);
    return updated;
  }

  private get(queryTabId: string): QueryTab | null {
    const row = this.database
      .prepare(
        `SELECT id, workspace_id, title, sql_text, sort_order, updated_at
         FROM query_tabs
         WHERE id = ?`
      )
      .get(queryTabId) as QueryTabRow | undefined;
    return row ? toQueryTab(row) : null;
  }

  private nextSortOrder(workspaceId: string): number {
    const row = this.database
      .prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM query_tabs WHERE workspace_id = ?'
      )
      .get(workspaceId) as { next_order: number };
    return row.next_order;
  }
}
