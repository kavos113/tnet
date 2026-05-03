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
export type RequesterRequestType = 'http' | 'websocket' | 'grpc';

export interface RequesterKeyValueRow {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
}

export interface RequesterCookie {
  id: string;
  workspaceId: string;
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresAt?: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  hostOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequesterNetworkOptions {
  validateTlsCertificates: boolean;
  proxy: {
    mode: 'system' | 'none' | 'http' | 'socks';
    host?: string;
    port?: number;
    username?: string;
    passwordSecretId?: string;
  };
  tls: {
    clientCertificatePath?: string;
    clientCertificateKeyPath?: string;
    clientCertificatePassphraseSecretId?: string;
    customCaCertificatePath?: string;
  };
}

export interface RequesterExtractionRule {
  id: string;
  enabled: boolean;
  source: 'json-body' | 'header';
  expression: string;
  targetVariable: string;
}

export interface RequesterRequestDetail extends RequesterRequestSummary {
  requestType: RequesterRequestType;
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
  extractionRules: RequesterExtractionRule[];
  websocketMessages: string[];
  grpcProtoPath: string;
  grpcPackageName: string;
  grpcServiceName: string;
  grpcMethodName: string;
  grpcMetadata: RequesterKeyValueRow[];
}

export interface SaveRequesterRequestInput {
  id?: string;
  executionId?: string;
  workspaceId: string;
  name: string;
  requestPath?: string;
  method: RequesterHttpMethod;
  url: string;
  requestType?: RequesterRequestType;
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
  variableSetId?: string;
  websocketMessages?: string[];
  grpcProtoPath?: string;
  grpcPackageName?: string;
  grpcServiceName?: string;
  grpcMethodName?: string;
  grpcMetadata?: RequesterKeyValueRow[];
  timeoutMs?: number;
  followRedirects?: boolean;
  cookieJarEnabled?: boolean;
  validateTlsCertificates?: boolean;
  proxyMode?: RequesterNetworkOptions['proxy']['mode'];
  proxyHost?: string;
  proxyPort?: number;
  proxyUsername?: string;
  proxyPasswordSecretId?: string;
  clientCertificatePath?: string;
  clientCertificateKeyPath?: string;
  clientCertificatePassphraseSecretId?: string;
  customCaCertificatePath?: string;
}

export interface RequesterVariableSet {
  id: string;
  workspaceId: string;
  name: string;
}

export interface RequesterVariable {
  key: string;
  value: string;
  updatedAt: string;
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
  previewType: 'json' | 'html' | 'text' | 'image' | 'pdf' | 'binary';
}

export interface RequesterExecutionErrorSnapshot {
  name: string;
  message: string;
  stack?: string;
  cause?: string;
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
