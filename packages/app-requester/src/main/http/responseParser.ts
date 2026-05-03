import type {
  RequesterKeyValueRow,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';

const maxStoredBodyBytes = 1024 * 1024;

const previewTypeForContentType = (
  contentType: string
): RequesterResponseSnapshot['previewType'] => {
  if (contentType.includes('application/json') || contentType.includes('+json')) return 'json';
  if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
    return 'html';
  }
  if (contentType.startsWith('text/') || contentType.includes('xml')) return 'text';
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.includes('application/pdf')) return 'pdf';
  return 'binary';
};

export const parseRequesterResponse = async (
  response: Response,
  durationMs: number
): Promise<RequesterResponseSnapshot> => parseRequesterBufferedResponse(response, durationMs);

export const parseRequesterBufferedResponse = async (
  response: Response,
  durationMs: number
): Promise<RequesterResponseSnapshot> => {
  const bytes = await response.arrayBuffer();
  return responseSnapshotFromBytes(response, bytes, durationMs);
};

export const parseRequesterStreamingResponse = async (
  response: Response,
  durationMs: () => number,
  onProgress?: (progress: {
    status: number;
    headers: RequesterKeyValueRow[];
    byteSize: number;
    durationMs: number;
  }) => void
): Promise<RequesterResponseSnapshot> => {
  if (!response.body) return parseRequesterBufferedResponse(response, durationMs());
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteSize = 0;
  const headers = headersFromResponse(response);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    byteSize += value.byteLength;
    onProgress?.({
      status: response.status,
      headers,
      byteSize,
      durationMs: durationMs()
    });
  }

  const bytes = new Uint8Array(byteSize);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return responseSnapshotFromBytes(response, bytes.buffer, durationMs());
};

const responseSnapshotFromBytes = (
  response: Response,
  bytes: ArrayBuffer,
  durationMs: number
): RequesterResponseSnapshot => {
  const contentType = response.headers.get('content-type') ?? '';
  const isBodyTruncated = bytes.byteLength > maxStoredBodyBytes;
  const previewBytes = bytes.slice(0, maxStoredBodyBytes);
  const decoder = new TextDecoder('utf-8');

  return {
    status: response.status,
    statusText: response.statusText,
    headers: headersFromResponse(response),
    bodyText: decoder.decode(previewBytes),
    bodyBase64: Buffer.from(previewBytes).toString('base64'),
    contentType,
    byteSize: bytes.byteLength,
    durationMs,
    isBodyTruncated,
    previewType: previewTypeForContentType(contentType)
  };
};

const headersFromResponse = (response: Response): RequesterKeyValueRow[] =>
  [...response.headers.entries()].map(([key, value]) => ({
    id: key,
    enabled: true,
    key,
    value
  }));
