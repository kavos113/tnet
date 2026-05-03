import type {
  RequesterKeyValueRow,
  RequesterRequestSnapshot,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import type { SerializedRequesterRequest } from '../http/requestSerializer';
import { redactRequesterHeaders } from './redaction';

const maxStoredBodyBytes = 1024 * 1024;

export const createHttpRequestSnapshot = async (
  request: SaveRequesterRequestInput,
  serialized: SerializedRequesterRequest
): Promise<RequesterRequestSnapshot> => {
  const headers = redactRequesterHeaders(headersFromRequestInit(serialized.init.headers));
  const contentType = findHeaderValue(headers, 'content-type');
  const bytes = await bodyBytesFromRequestBody(serialized.init.body);

  return {
    workspaceId: request.workspaceId,
    requestId: request.id,
    requestName: request.name,
    requestType: request.requestType ?? 'http',
    method: request.method,
    url: request.url,
    executedUrl: serialized.url,
    headers,
    bodyMode: request.bodyMode ?? 'none',
    ...requestBodySnapshot(bytes, contentType)
  };
};

export const createGrpcRequestSnapshot = (
  request: SaveRequesterRequestInput
): RequesterRequestSnapshot => {
  const headers = redactRequesterHeaders(
    (request.grpcMetadata ?? [])
      .filter((row) => row.enabled && row.key.trim())
      .map((row) => ({
        id: row.id,
        enabled: true,
        key: row.key,
        value: row.value
      }))
  );
  const body = new TextEncoder().encode(request.bodyText ?? '');

  return {
    workspaceId: request.workspaceId,
    requestId: request.id,
    requestName: request.name,
    requestType: 'grpc',
    method: request.method,
    url: request.url,
    executedUrl: request.url,
    headers,
    bodyMode: request.bodyMode ?? 'json',
    ...requestBodySnapshot(body, 'application/grpc+json')
  };
};

const headersFromRequestInit = (headers: RequestInit['headers']): RequesterKeyValueRow[] => {
  if (!headers) return [];
  return [...new Headers(headers).entries()].map(([key, value]) => ({
    id: key,
    enabled: true,
    key,
    value
  }));
};

const findHeaderValue = (headers: RequesterKeyValueRow[], key: string): string =>
  headers.find((header) => header.key.trim().toLowerCase() === key)?.value ?? '';

const bodyBytesFromRequestBody = async (body: BodyInit | null | undefined): Promise<Uint8Array> => {
  if (!body) return new Uint8Array();
  if (typeof body === 'string') return new TextEncoder().encode(body);
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  if (ArrayBuffer.isView(body)) {
    return new Uint8Array(body.buffer, body.byteOffset, body.byteLength);
  }
  if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
  return new TextEncoder().encode(String(body));
};

const requestBodySnapshot = (
  bytes: Uint8Array,
  contentType: string
): Pick<
  RequesterRequestSnapshot,
  'bodyBase64' | 'bodyText' | 'byteSize' | 'contentType' | 'isBodyTruncated' | 'previewType'
> => {
  const previewBytes = bytes.slice(0, maxStoredBodyBytes);
  const previewType = requestPreviewType(contentType);

  return {
    bodyText: previewType === 'binary' ? '' : new TextDecoder('utf-8').decode(previewBytes),
    bodyBase64: Buffer.from(previewBytes).toString('base64'),
    contentType,
    byteSize: bytes.byteLength,
    isBodyTruncated: bytes.byteLength > maxStoredBodyBytes,
    previewType
  };
};

const requestPreviewType = (contentType: string): RequesterRequestSnapshot['previewType'] => {
  const normalized = contentType.toLowerCase();
  if (normalized.includes('json')) return 'json';
  if (normalized.includes('html')) return 'html';
  if (normalized.startsWith('text/') || normalized.includes('xml')) return 'text';
  if (!normalized) return 'text';
  return 'binary';
};
