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

export interface RequesterVariableSet {
  id: string;
  workspaceId: string;
  name: string;
}
