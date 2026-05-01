import { randomUUID } from 'node:crypto';
import type {
  RequesterHistoryDetail,
  RequesterHistoryEntry,
  RequesterResponseSnapshot,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterHistoryStore } from '../service/requestExecutionService';
import type { RequesterDatabase } from './requesterDb';

interface HistoryRow {
  id: string;
  workspace_id: string;
  request_id: string | null;
  started_at: string;
  duration_ms: number;
  status: number | null;
  request_snapshot_json: string;
  response_snapshot_json: string;
}

const toEntry = (row: HistoryRow): RequesterHistoryEntry => {
  const request = JSON.parse(row.request_snapshot_json) as SaveRequesterRequestInput;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    requestId: row.request_id ?? undefined,
    requestName: request.name,
    method: request.method,
    url: request.url,
    startedAt: row.started_at,
    durationMs: row.duration_ms,
    status: row.status ?? undefined
  };
};

export class HistoryRepository implements RequesterHistoryStore {
  constructor(private readonly database: RequesterDatabase) {}

  saveExecution(input: {
    request: SaveRequesterRequestInput;
    response: RequesterResponseSnapshot;
    startedAt: string;
  }): string | undefined {
    const id = randomUUID();
    this.database
      .prepare(
        `INSERT INTO history_entries (
           id, workspace_id, request_id, started_at, duration_ms, status,
           request_snapshot_json, response_snapshot_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.request.workspaceId,
        input.request.id ?? null,
        input.startedAt,
        input.response.durationMs,
        input.response.status,
        JSON.stringify(input.request),
        JSON.stringify(input.response)
      );
    return id;
  }

  list(workspaceId: string, requestId?: string): RequesterHistoryEntry[] {
    const rows = requestId
      ? (this.database
          .prepare(
            `SELECT id, workspace_id, request_id, started_at, duration_ms, status,
                    request_snapshot_json, response_snapshot_json
             FROM history_entries
             WHERE workspace_id = ? AND request_id = ?
             ORDER BY started_at DESC`
          )
          .all(workspaceId, requestId) as HistoryRow[])
      : (this.database
          .prepare(
            `SELECT id, workspace_id, request_id, started_at, duration_ms, status,
                    request_snapshot_json, response_snapshot_json
             FROM history_entries
             WHERE workspace_id = ?
             ORDER BY started_at DESC`
          )
          .all(workspaceId) as HistoryRow[]);
    return rows.map(toEntry);
  }

  get(historyId: string): RequesterHistoryDetail | null {
    const row = this.database
      .prepare(
        `SELECT id, workspace_id, request_id, started_at, duration_ms, status,
                request_snapshot_json, response_snapshot_json
         FROM history_entries
         WHERE id = ?`
      )
      .get(historyId) as HistoryRow | undefined;
    if (!row) return null;
    return {
      ...toEntry(row),
      requestSnapshot: JSON.parse(row.request_snapshot_json) as SaveRequesterRequestInput,
      responseSnapshot: JSON.parse(row.response_snapshot_json) as RequesterResponseSnapshot
    };
  }

  remove(historyId: string): void {
    this.database.prepare('DELETE FROM history_entries WHERE id = ?').run(historyId);
  }

  clear(workspaceId: string): void {
    this.database.prepare('DELETE FROM history_entries WHERE workspace_id = ?').run(workspaceId);
  }
}
