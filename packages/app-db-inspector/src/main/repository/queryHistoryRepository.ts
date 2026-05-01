import { randomUUID } from 'node:crypto';
import type { QueryHistoryEntry } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorDatabase } from './dbInspectorDb';

interface QueryHistoryRow {
  id: string;
  workspace_id: string;
  sql_text: string;
  started_at: string;
  duration_ms: number;
  row_count: number;
  error_code: string | null;
  error_message: string | null;
}

const toEntry = (row: QueryHistoryRow): QueryHistoryEntry => ({
  id: row.id,
  workspaceId: row.workspace_id,
  sqlText: row.sql_text,
  startedAt: row.started_at,
  durationMs: row.duration_ms,
  rowCount: row.row_count,
  errorCode: row.error_code ?? undefined,
  errorMessage: row.error_message ?? undefined
});

export class QueryHistoryRepository {
  constructor(private readonly database: DbInspectorDatabase) {}

  save(input: Omit<QueryHistoryEntry, 'id'>): QueryHistoryEntry {
    const entry: QueryHistoryEntry = {
      id: randomUUID(),
      ...input
    };
    this.database
      .prepare(
        `INSERT INTO query_history (
           id, workspace_id, sql_text, started_at, duration_ms, row_count, error_code, error_message
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        entry.id,
        entry.workspaceId,
        entry.sqlText,
        entry.startedAt,
        entry.durationMs,
        entry.rowCount,
        entry.errorCode ?? null,
        entry.errorMessage ?? null
      );
    return entry;
  }

  list(workspaceId: string): QueryHistoryEntry[] {
    const rows = this.database
      .prepare(
        `SELECT id, workspace_id, sql_text, started_at, duration_ms, row_count, error_code, error_message
         FROM query_history
         WHERE workspace_id = ?
         ORDER BY started_at DESC`
      )
      .all(workspaceId) as QueryHistoryRow[];
    return rows.map(toEntry);
  }
}
