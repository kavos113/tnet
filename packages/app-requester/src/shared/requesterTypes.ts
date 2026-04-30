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

export type RequesterBodyMode = 'none' | 'json' | 'text' | 'form-url-encoded' | 'graphql';

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
}

export interface RequesterVariableSet {
  id: string;
  workspaceId: string;
  name: string;
}
