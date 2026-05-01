import { randomUUID } from 'node:crypto';
import {
  normalizeRequestPath,
  requesterRequestExtension,
  requestNameFromPath
} from '@tnet/app-requester/shared/requestPath';
import type {
  RequesterBodyMode,
  RequesterAuthType,
  RequesterExtractionRule,
  RequesterHttpMethod,
  RequesterKeyValueRow,
  RequesterRequestDetail,
  RequesterRequestSummary,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterDatabase } from './requesterDb';

interface RequestRow {
  id: string;
  workspace_id: string;
  name: string;
  request_path: string;
  method: RequesterHttpMethod;
  url: string;
  request_json: string;
}

interface RequestJson {
  headers?: RequesterKeyValueRow[];
  queryParams?: RequesterKeyValueRow[];
  bodyMode?: RequesterBodyMode;
  bodyText?: string;
  binaryFilePath?: string;
  graphqlVariablesText?: string;
  graphqlOperationName?: string;
  authType?: RequesterAuthType;
  authUsername?: string;
  authPassword?: string;
  authToken?: string;
  authApiKeyName?: string;
  authApiKeyValue?: string;
  extractionRules?: RequesterExtractionRule[];
}

const emptyRequestJson = (): Required<RequestJson> => ({
  headers: [],
  queryParams: [],
  bodyMode: 'none',
  bodyText: '',
  binaryFilePath: '',
  graphqlVariablesText: '',
  graphqlOperationName: '',
  authType: 'none',
  authUsername: '',
  authPassword: '',
  authToken: '',
  authApiKeyName: '',
  authApiKeyValue: '',
  extractionRules: []
});

const parseRequestJson = (json: string): Required<RequestJson> => ({
  ...emptyRequestJson(),
  ...(JSON.parse(json) as RequestJson)
});

const requestJsonFromInput = (
  input: SaveRequesterRequestInput,
  existing: RequesterRequestDetail | undefined
): Required<RequestJson> => ({
  headers: input.headers ?? existing?.headers ?? [],
  queryParams: input.queryParams ?? existing?.queryParams ?? [],
  bodyMode: input.bodyMode ?? existing?.bodyMode ?? 'none',
  bodyText: input.bodyText ?? existing?.bodyText ?? '',
  binaryFilePath: input.binaryFilePath ?? existing?.binaryFilePath ?? '',
  graphqlVariablesText: input.graphqlVariablesText ?? existing?.graphqlVariablesText ?? '',
  graphqlOperationName: input.graphqlOperationName ?? existing?.graphqlOperationName ?? '',
  authType: input.authType ?? existing?.authType ?? 'none',
  authUsername: input.authUsername ?? existing?.authUsername ?? '',
  authPassword: input.authPassword ?? existing?.authPassword ?? '',
  authToken: input.authToken ?? existing?.authToken ?? '',
  authApiKeyName: input.authApiKeyName ?? existing?.authApiKeyName ?? '',
  authApiKeyValue: input.authApiKeyValue ?? existing?.authApiKeyValue ?? '',
  extractionRules: input.extractionRules ?? existing?.extractionRules ?? []
});

const toSummary = (row: RequestRow): RequesterRequestSummary => ({
  id: row.id,
  workspaceId: row.workspace_id,
  name: row.name,
  requestPath: row.request_path,
  method: row.method,
  url: row.url
});

const toDetail = (row: RequestRow): RequesterRequestDetail => {
  const requestJson = parseRequestJson(row.request_json);
  return {
    ...toSummary(row),
    headers: requestJson.headers,
    queryParams: requestJson.queryParams,
    bodyMode: requestJson.bodyMode,
    bodyText: requestJson.bodyText,
    binaryFilePath: requestJson.binaryFilePath,
    graphqlVariablesText: requestJson.graphqlVariablesText,
    graphqlOperationName: requestJson.graphqlOperationName,
    authType: requestJson.authType,
    authUsername: requestJson.authUsername,
    authPassword: requestJson.authPassword,
    authToken: requestJson.authToken,
    authApiKeyName: requestJson.authApiKeyName,
    authApiKeyValue: requestJson.authApiKeyValue,
    extractionRules: requestJson.extractionRules
  };
};

export class RequestRepository {
  constructor(private readonly database: RequesterDatabase) {}

  list(workspaceId: string): RequesterRequestSummary[] {
    const rows = this.database
      .prepare(
        `SELECT id, workspace_id, name, request_path, method, url, request_json
         FROM requests
         WHERE workspace_id = ?
         ORDER BY sort_order ASC, updated_at DESC`
      )
      .all(workspaceId) as RequestRow[];
    return rows.map(toSummary);
  }

  get(requestId: string): RequesterRequestDetail | null {
    const row = this.database
      .prepare(
        `SELECT id, workspace_id, name, request_path, method, url, request_json
         FROM requests
         WHERE id = ?`
      )
      .get(requestId) as RequestRow | undefined;
    return row ? toDetail(row) : null;
  }

  save(input: SaveRequesterRequestInput): RequesterRequestDetail {
    return input.id ? this.update(input) : this.create(input);
  }

  duplicate(requestId: string): RequesterRequestDetail {
    const source = this.get(requestId);
    if (!source) throw new Error(`Request not found: ${requestId}`);
    return this.create({
      ...source,
      id: undefined,
      name: `${source.name} Copy`,
      requestPath: this.nextAvailablePath(source.workspaceId, `${source.name} Copy`)
    });
  }

  rename(requestId: string, name: string): RequesterRequestDetail {
    const existing = this.get(requestId);
    if (!existing) throw new Error(`Request not found: ${requestId}`);
    return this.update({
      ...existing,
      name,
      requestPath: this.nextAvailablePath(existing.workspaceId, name, requestId)
    });
  }

  remove(requestId: string): void {
    this.database.prepare('DELETE FROM requests WHERE id = ?').run(requestId);
  }

  reorder(workspaceId: string, requestIds: string[]): void {
    const update = this.database.prepare(
      'UPDATE requests SET sort_order = ?, updated_at = ? WHERE workspace_id = ? AND id = ?'
    );
    const now = new Date().toISOString();
    const transaction = this.database.transaction((ids: string[]) => {
      ids.forEach((requestId, index) => update.run(index, now, workspaceId, requestId));
    });
    transaction(requestIds);
  }

  private create(input: SaveRequesterRequestInput): RequesterRequestDetail {
    const now = new Date().toISOString();
    const requestPath = this.nextAvailablePath(input.workspaceId, input.requestPath ?? input.name);
    const name = input.name.trim() || requestNameFromPath(requestPath);
    const sortOrder = this.nextSortOrder(input.workspaceId);
    const id = randomUUID();
    this.database
      .prepare(
        `INSERT INTO requests (
           id, workspace_id, name, request_path, sort_order, method, url, request_json, created_at, updated_at
         ) VALUES (
           @id, @workspaceId, @name, @requestPath, @sortOrder, @method, @url, @requestJson, @createdAt, @updatedAt
         )`
      )
      .run({
        id,
        workspaceId: input.workspaceId,
        name,
        requestPath,
        sortOrder,
        method: input.method,
        url: input.url,
        requestJson: JSON.stringify(requestJsonFromInput(input, undefined)),
        createdAt: now,
        updatedAt: now
      });
    const created = this.get(id);
    if (!created) throw new Error(`Request was not created: ${id}`);
    return created;
  }

  private update(input: SaveRequesterRequestInput): RequesterRequestDetail {
    if (!input.id) throw new Error('Request id is required for update');
    const existing = this.get(input.id);
    if (!existing) throw new Error(`Request not found: ${input.id}`);
    const requestPath = input.requestPath
      ? this.nextAvailablePath(input.workspaceId, input.requestPath, input.id)
      : existing.requestPath;
    this.database
      .prepare(
        `UPDATE requests
         SET name = @name,
             request_path = @requestPath,
             method = @method,
             url = @url,
             request_json = @requestJson,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id: input.id,
        name: input.name.trim() || existing.name,
        requestPath,
        method: input.method,
        url: input.url,
        requestJson: JSON.stringify(requestJsonFromInput(input, existing)),
        updatedAt: new Date().toISOString()
      });
    const updated = this.get(input.id);
    if (!updated) throw new Error(`Request not found after update: ${input.id}`);
    return updated;
  }

  private nextSortOrder(workspaceId: string): number {
    const row = this.database
      .prepare(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM requests WHERE workspace_id = ?'
      )
      .get(workspaceId) as { next_order: number };
    return row.next_order;
  }

  private nextAvailablePath(workspaceId: string, nameOrPath: string, currentId?: string): string {
    const basePath = normalizeRequestPath(nameOrPath);
    const extensionless = basePath.endsWith(requesterRequestExtension)
      ? basePath.slice(0, -requesterRequestExtension.length)
      : basePath;
    let candidate = basePath;
    let index = 2;

    while (this.pathExists(workspaceId, candidate, currentId)) {
      candidate = `${extensionless} ${index}${requesterRequestExtension}`;
      index += 1;
    }

    return candidate;
  }

  private pathExists(workspaceId: string, requestPath: string, currentId?: string): boolean {
    const row = this.database
      .prepare(
        `SELECT id FROM requests
         WHERE workspace_id = ? AND request_path = ? AND (? IS NULL OR id != ?)`
      )
      .get(workspaceId, requestPath, currentId ?? null, currentId ?? null) as
      | { id: string }
      | undefined;
    return Boolean(row);
  }
}
