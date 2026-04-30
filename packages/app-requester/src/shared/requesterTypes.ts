export type RequesterHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RequesterWorkspace {
  id: string;
  name: string;
}

export interface RequesterRequestSummary {
  id: string;
  workspaceId: string;
  name: string;
  requestPath: string;
  method: RequesterHttpMethod;
  url: string;
}

export type RequesterBodyMode =
  | 'none'
  | 'json'
  | 'text'
  | 'form-url-encoded'
  | 'graphql'
  | 'binary-file';
export type RequesterAuthType = 'none' | 'basic' | 'bearer' | 'api-key-header' | 'api-key-query';

export interface RequesterKeyValueRow {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
}

export interface RequesterRequestDetail extends RequesterRequestSummary {
  headers: RequesterKeyValueRow[];
  queryParams: RequesterKeyValueRow[];
  bodyMode: RequesterBodyMode;
  bodyText: string;
  binaryFilePath: string;
  graphqlVariablesText: string;
  graphqlOperationName: string;
  authType: RequesterAuthType;
  authUsername: string;
  authPassword: string;
  authToken: string;
  authApiKeyName: string;
  authApiKeyValue: string;
}

export interface SaveRequesterRequestInput {
  id?: string;
  workspaceId: string;
  name: string;
  requestPath?: string;
  method: RequesterHttpMethod;
  url: string;
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
}

export interface RequesterVariableSet {
  id: string;
  workspaceId: string;
  name: string;
}

export interface RequesterResponseSnapshot {
  status: number;
  statusText: string;
  headers: RequesterKeyValueRow[];
  bodyText: string;
  bodyBase64: string;
  contentType: string;
  byteSize: number;
  durationMs: number;
  isBodyTruncated: boolean;
  previewType: 'json' | 'text' | 'image' | 'pdf' | 'binary';
}

export interface RequesterExecutionResult {
  response: RequesterResponseSnapshot;
  historyId?: string;
}

export interface RequesterHistoryEntry {
  id: string;
  workspaceId: string;
  requestId?: string;
  requestName: string;
  method: RequesterHttpMethod;
  url: string;
  startedAt: string;
  durationMs: number;
  status?: number;
}

export interface RequesterHistoryDetail extends RequesterHistoryEntry {
  requestSnapshot: SaveRequesterRequestInput;
  responseSnapshot: RequesterResponseSnapshot;
}

export interface RequesterGraphqlSchemaCache {
  id: string;
  workspaceId: string;
  endpointHash: string;
  schemaJson: string;
  fetchedAt: string;
}
