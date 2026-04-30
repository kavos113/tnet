import fs from 'fs/promises';
import type {
  RequesterKeyValueRow,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import { applyRequesterAuth } from './auth';

export interface SerializedRequesterRequest {
  url: string;
  init: RequestInit;
}

const enabledRows = (rows: RequesterKeyValueRow[] = []): RequesterKeyValueRow[] =>
  rows.filter((row) => row.enabled && row.key.trim());

const appendQueryParams = (url: URL, rows: RequesterKeyValueRow[]): void => {
  for (const row of enabledRows(rows)) {
    url.searchParams.set(row.key, row.value);
  }
};

const headersFromRows = (rows: RequesterKeyValueRow[]): Headers => {
  const headers = new Headers();
  for (const row of enabledRows(rows)) {
    headers.set(row.key, row.value);
  }
  return headers;
};

export const serializeRequesterRequest = async (
  request: SaveRequesterRequestInput
): Promise<SerializedRequesterRequest> => {
  const { headers, queryParams } = applyRequesterAuth(request);
  const url = new URL(request.url);
  appendQueryParams(url, queryParams);
  const requestHeaders = headersFromRows(headers);
  const bodyMode = request.bodyMode ?? 'none';
  let body: BodyInit | undefined;

  if (bodyMode === 'json') {
    requestHeaders.set('Content-Type', requestHeaders.get('Content-Type') ?? 'application/json');
    body = request.bodyText ?? '';
  } else if (bodyMode === 'text' || bodyMode === 'graphql') {
    requestHeaders.set(
      'Content-Type',
      requestHeaders.get('Content-Type') ??
        (bodyMode === 'graphql' ? 'application/json' : 'text/plain; charset=utf-8')
    );
    body =
      bodyMode === 'graphql'
        ? JSON.stringify({
            query: request.bodyText ?? '',
            variables: request.graphqlVariablesText
              ? (JSON.parse(request.graphqlVariablesText) as unknown)
              : undefined,
            operationName: request.graphqlOperationName || undefined
          })
        : (request.bodyText ?? '');
  } else if (bodyMode === 'form-url-encoded') {
    requestHeaders.set(
      'Content-Type',
      requestHeaders.get('Content-Type') ?? 'application/x-www-form-urlencoded'
    );
    body = request.bodyText ?? '';
  } else if (bodyMode === 'binary-file' && request.binaryFilePath) {
    body = new Uint8Array(await fs.readFile(request.binaryFilePath));
  }

  return {
    url: url.toString(),
    init: {
      method: request.method,
      headers: requestHeaders,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : body
    }
  };
};
