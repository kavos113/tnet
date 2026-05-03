import { randomUUID } from 'node:crypto';
import type {
  RequesterBodyMode,
  RequesterHistoryDetail,
  RequesterHistoryEntry,
  RequesterHttpMethod,
  RequesterKeyValueRow,
  RequesterRequestSnapshot,
  RequesterRequestType,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterHistoryStore } from '../service/requestExecutionService';
import type { RequesterDatabase } from './requesterDb';

interface HistoryRow {
  id: string;
  workspace_id: string;
  request_id: string | null;
  request_name: string;
  request_type: RequesterRequestType;
  method: RequesterHttpMethod;
  url: string;
  executed_url: string;
  started_at: string;
  duration_ms: number;
  status: number | null;
  status_text: string;
  request_body_mode: RequesterBodyMode;
  request_content_type: string;
  request_body_text: string;
  request_body_base64: string;
  request_byte_size: number;
  request_is_body_truncated: number;
  request_preview_type: RequesterRequestSnapshot['previewType'];
  response_content_type: string;
  response_body_text: string;
  response_body_base64: string;
  response_byte_size: number;
  response_is_body_truncated: number;
  response_preview_type: RequesterResponseSnapshot['previewType'];
}

interface HeaderRow {
  id: string;
  header_key: string;
  header_value: string;
}

const toEntry = (row: HistoryRow): RequesterHistoryEntry => ({
  id: row.id,
  workspaceId: row.workspace_id,
  requestId: row.request_id ?? undefined,
  requestName: row.request_name,
  method: row.method,
  url: row.executed_url,
  startedAt: row.started_at,
  durationMs: row.duration_ms,
  status: row.status ?? undefined
});

export class HistoryRepository implements RequesterHistoryStore {
  constructor(private readonly database: RequesterDatabase) {}

  saveExecution(input: {
    request: RequesterRequestSnapshot;
    response: RequesterResponseSnapshot;
    startedAt: string;
  }): string | undefined {
    const id = randomUUID();
    const transaction = this.database.transaction(() => {
      this.database
        .prepare(
          `INSERT INTO history_entries (
             id, workspace_id, request_id, request_name, request_type, method, url, executed_url,
             started_at, duration_ms, status, status_text,
             request_body_mode, request_content_type, request_body_text, request_body_base64,
             request_byte_size, request_is_body_truncated, request_preview_type,
             response_content_type, response_body_text, response_body_base64, response_byte_size,
             response_is_body_truncated, response_preview_type
           ) VALUES (
             @id, @workspaceId, @requestId, @requestName, @requestType, @method, @url, @executedUrl,
             @startedAt, @durationMs, @status, @statusText,
             @requestBodyMode, @requestContentType, @requestBodyText, @requestBodyBase64,
             @requestByteSize, @requestIsBodyTruncated, @requestPreviewType,
             @responseContentType, @responseBodyText, @responseBodyBase64, @responseByteSize,
             @responseIsBodyTruncated, @responsePreviewType
           )`
        )
        .run({
          id,
          workspaceId: input.request.workspaceId,
          requestId: input.request.requestId ?? null,
          requestName: input.request.requestName,
          requestType: input.request.requestType,
          method: input.request.method,
          url: input.request.url,
          executedUrl: input.request.executedUrl,
          startedAt: input.startedAt,
          durationMs: input.response.durationMs,
          status: input.response.status,
          statusText: input.response.statusText,
          requestBodyMode: input.request.bodyMode,
          requestContentType: input.request.contentType,
          requestBodyText: input.request.bodyText,
          requestBodyBase64: input.request.bodyBase64,
          requestByteSize: input.request.byteSize,
          requestIsBodyTruncated: input.request.isBodyTruncated ? 1 : 0,
          requestPreviewType: input.request.previewType,
          responseContentType: input.response.contentType,
          responseBodyText: input.response.bodyText,
          responseBodyBase64: input.response.bodyBase64,
          responseByteSize: input.response.byteSize,
          responseIsBodyTruncated: input.response.isBodyTruncated ? 1 : 0,
          responsePreviewType: input.response.previewType
        });
      this.insertHeaders('history_request_headers', id, input.request.headers);
      this.insertHeaders('history_response_headers', id, input.response.headers);
    });
    transaction();
    return id;
  }

  list(workspaceId: string, requestId?: string): RequesterHistoryEntry[] {
    const rows = requestId
      ? (this.database
          .prepare(
            `SELECT *
             FROM history_entries
             WHERE workspace_id = ? AND request_id = ?
             ORDER BY started_at DESC`
          )
          .all(workspaceId, requestId) as HistoryRow[])
      : (this.database
          .prepare(
            `SELECT *
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
        `SELECT *
         FROM history_entries
         WHERE id = ?`
      )
      .get(historyId) as HistoryRow | undefined;
    if (!row) return null;

    return {
      ...toEntry(row),
      requestSnapshot: {
        workspaceId: row.workspace_id,
        requestId: row.request_id ?? undefined,
        requestName: row.request_name,
        requestType: row.request_type,
        method: row.method,
        url: row.url,
        executedUrl: row.executed_url,
        headers: this.listHeaders('history_request_headers', historyId),
        bodyMode: row.request_body_mode,
        bodyText: row.request_body_text,
        bodyBase64: row.request_body_base64,
        contentType: row.request_content_type,
        byteSize: row.request_byte_size,
        isBodyTruncated: Boolean(row.request_is_body_truncated),
        previewType: row.request_preview_type
      },
      responseSnapshot: {
        status: row.status ?? 0,
        statusText: row.status_text,
        headers: this.listHeaders('history_response_headers', historyId),
        bodyText: row.response_body_text,
        bodyBase64: row.response_body_base64,
        contentType: row.response_content_type,
        byteSize: row.response_byte_size,
        durationMs: row.duration_ms,
        isBodyTruncated: Boolean(row.response_is_body_truncated),
        previewType: row.response_preview_type
      }
    };
  }

  remove(historyId: string): void {
    this.database.prepare('DELETE FROM history_entries WHERE id = ?').run(historyId);
  }

  clear(workspaceId: string): void {
    this.database.prepare('DELETE FROM history_entries WHERE workspace_id = ?').run(workspaceId);
  }

  private insertHeaders(
    tableName: 'history_request_headers' | 'history_response_headers',
    historyId: string,
    headers: RequesterKeyValueRow[]
  ): void {
    const insert = this.database.prepare(
      `INSERT INTO ${tableName} (id, history_id, sort_order, header_key, header_value)
       VALUES (?, ?, ?, ?, ?)`
    );
    headers.forEach((header, index) => {
      insert.run(randomUUID(), historyId, index, header.key, header.value);
    });
  }

  private listHeaders(
    tableName: 'history_request_headers' | 'history_response_headers',
    historyId: string
  ): RequesterKeyValueRow[] {
    const rows = this.database
      .prepare(
        `SELECT id, header_key, header_value
         FROM ${tableName}
         WHERE history_id = ?
         ORDER BY sort_order ASC`
      )
      .all(historyId) as HeaderRow[];
    return rows.map((row) => ({
      id: row.id,
      enabled: true,
      key: row.header_key,
      value: row.header_value
    }));
  }
}
