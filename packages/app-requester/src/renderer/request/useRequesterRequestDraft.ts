import { useEffect, useState } from 'react';
import type {
  RequesterAuthType,
  RequesterBodyMode,
  RequesterHttpMethod,
  RequesterKeyValueRow,
  RequesterRequestDetail,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import type { GraphqlSchemaTypeSummary } from './requesterAppHelpers';

export interface RequesterRequestDraft {
  name: string;
  method: RequesterHttpMethod;
  url: string;
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
  graphqlSchemaTypes: GraphqlSchemaTypeSummary[];
  setName: (value: string) => void;
  setMethod: (value: RequesterHttpMethod) => void;
  setUrl: (value: string) => void;
  setHeaders: (value: RequesterKeyValueRow[]) => void;
  setQueryParams: (value: RequesterKeyValueRow[]) => void;
  setBodyMode: (value: RequesterBodyMode) => void;
  setBodyText: (value: string) => void;
  setBinaryFilePath: (value: string) => void;
  setGraphqlVariablesText: (value: string) => void;
  setGraphqlOperationName: (value: string) => void;
  setAuthType: (value: RequesterAuthType) => void;
  setAuthUsername: (value: string) => void;
  setAuthPassword: (value: string) => void;
  setAuthToken: (value: string) => void;
  setAuthApiKeyName: (value: string) => void;
  setAuthApiKeyValue: (value: string) => void;
  setGraphqlSchemaTypes: (value: GraphqlSchemaTypeSummary[]) => void;
  buildRequestInput: (nameOverride?: string) => SaveRequesterRequestInput | undefined;
}

export const useRequesterRequestDraft = (
  activeRequest: RequesterRequestDetail | undefined,
  activeWorkspaceId: string | undefined
): RequesterRequestDraft => {
  const [name, setName] = useState('');
  const [method, setMethod] = useState<RequesterHttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<RequesterKeyValueRow[]>([]);
  const [queryParams, setQueryParams] = useState<RequesterKeyValueRow[]>([]);
  const [bodyMode, setBodyMode] = useState<RequesterBodyMode>('none');
  const [bodyText, setBodyText] = useState('');
  const [binaryFilePath, setBinaryFilePath] = useState('');
  const [graphqlVariablesText, setGraphqlVariablesText] = useState('');
  const [graphqlOperationName, setGraphqlOperationName] = useState('');
  const [authType, setAuthType] = useState<RequesterAuthType>(activeRequest?.authType ?? 'none');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [authApiKeyName, setAuthApiKeyName] = useState('');
  const [authApiKeyValue, setAuthApiKeyValue] = useState('');
  const [graphqlSchemaTypes, setGraphqlSchemaTypes] = useState<GraphqlSchemaTypeSummary[]>([]);

  useEffect(() => {
    setName(activeRequest?.name ?? '');
    setMethod(activeRequest?.method ?? 'GET');
    setUrl(activeRequest?.url ?? '');
    setHeaders(activeRequest?.headers ?? []);
    setQueryParams(activeRequest?.queryParams ?? []);
    setBodyMode(activeRequest?.bodyMode ?? 'none');
    setBodyText(activeRequest?.bodyText ?? '');
    setBinaryFilePath(activeRequest?.binaryFilePath ?? '');
    setGraphqlVariablesText(activeRequest?.graphqlVariablesText ?? '');
    setGraphqlOperationName(activeRequest?.graphqlOperationName ?? '');
    setAuthType(activeRequest?.authType ?? 'none');
    setAuthUsername(activeRequest?.authUsername ?? '');
    setAuthPassword(activeRequest?.authPassword ?? '');
    setAuthToken(activeRequest?.authToken ?? '');
    setAuthApiKeyName(activeRequest?.authApiKeyName ?? '');
    setAuthApiKeyValue(activeRequest?.authApiKeyValue ?? '');
    setGraphqlSchemaTypes([]);
  }, [activeRequest]);

  const buildRequestInput = (nameOverride?: string): SaveRequesterRequestInput | undefined => {
    if (!activeWorkspaceId) return undefined;

    return {
      id: activeRequest?.id,
      workspaceId: activeWorkspaceId,
      name: (nameOverride ?? name).trim() || 'Untitled Request',
      method,
      url,
      bodyMode,
      bodyText,
      binaryFilePath,
      graphqlVariablesText,
      graphqlOperationName,
      headers,
      queryParams,
      authType,
      authUsername,
      authPassword,
      authToken,
      authApiKeyName,
      authApiKeyValue,
      extractionRules: activeRequest?.extractionRules ?? []
    };
  };

  return {
    name,
    method,
    url,
    headers,
    queryParams,
    bodyMode,
    bodyText,
    binaryFilePath,
    graphqlVariablesText,
    graphqlOperationName,
    authType,
    authUsername,
    authPassword,
    authToken,
    authApiKeyName,
    authApiKeyValue,
    graphqlSchemaTypes,
    setName,
    setMethod,
    setUrl,
    setHeaders,
    setQueryParams,
    setBodyMode,
    setBodyText,
    setBinaryFilePath,
    setGraphqlVariablesText,
    setGraphqlOperationName,
    setAuthType,
    setAuthUsername,
    setAuthPassword,
    setAuthToken,
    setAuthApiKeyName,
    setAuthApiKeyValue,
    setGraphqlSchemaTypes,
    buildRequestInput
  };
};
