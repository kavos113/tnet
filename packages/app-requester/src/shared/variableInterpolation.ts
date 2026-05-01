import type {
  RequesterKeyValueRow,
  RequesterVariable,
  SaveRequesterRequestInput
} from './requesterTypes';

export const interpolateText = (
  text: string | undefined,
  variables: RequesterVariable[]
): string => {
  if (!text) return text ?? '';
  const variableMap = new Map(variables.map((variable) => [variable.key, variable.value]));
  return text.replace(
    /\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g,
    (match, key: string) => variableMap.get(key) ?? match
  );
};

export const interpolateRequesterRequest = (
  request: SaveRequesterRequestInput,
  variables: RequesterVariable[]
): SaveRequesterRequestInput => ({
  ...request,
  url: interpolateText(request.url, variables),
  bodyText: interpolateText(request.bodyText, variables),
  binaryFilePath: interpolateText(request.binaryFilePath, variables),
  graphqlVariablesText: interpolateText(request.graphqlVariablesText, variables),
  graphqlOperationName: interpolateText(request.graphqlOperationName, variables),
  authUsername: interpolateText(request.authUsername, variables),
  authPassword: interpolateText(request.authPassword, variables),
  authToken: interpolateText(request.authToken, variables),
  authApiKeyName: interpolateText(request.authApiKeyName, variables),
  authApiKeyValue: interpolateText(request.authApiKeyValue, variables),
  headers: interpolateRows(request.headers, variables),
  queryParams: interpolateRows(request.queryParams, variables)
});

const interpolateRows = (
  rows: RequesterKeyValueRow[] | undefined,
  variables: RequesterVariable[]
): RequesterKeyValueRow[] | undefined =>
  rows?.map((row) => ({
    ...row,
    key: interpolateText(row.key, variables),
    value: interpolateText(row.value, variables)
  }));
