import type {
  RequesterKeyValueRow,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';

const makeRow = (key: string, value: string): RequesterKeyValueRow => ({
  id: `${key}:${value}`,
  enabled: true,
  key,
  value
});

export const applyRequesterAuth = (
  request: SaveRequesterRequestInput
): {
  headers: RequesterKeyValueRow[];
  queryParams: RequesterKeyValueRow[];
} => {
  const headers = [...(request.headers ?? [])];
  const queryParams = [...(request.queryParams ?? [])];
  const authType = request.authType ?? 'none';

  if (authType === 'basic') {
    const credentials = Buffer.from(
      `${request.authUsername ?? ''}:${request.authPassword ?? ''}`,
      'utf-8'
    ).toString('base64');
    headers.push(makeRow('Authorization', `Basic ${credentials}`));
  } else if (authType === 'bearer' && request.authToken) {
    headers.push(makeRow('Authorization', `Bearer ${request.authToken}`));
  } else if (authType === 'api-key-header' && request.authApiKeyName) {
    headers.push(makeRow(request.authApiKeyName, request.authApiKeyValue ?? ''));
  } else if (authType === 'api-key-query' && request.authApiKeyName) {
    queryParams.push(makeRow(request.authApiKeyName, request.authApiKeyValue ?? ''));
  }

  return { headers, queryParams };
};
