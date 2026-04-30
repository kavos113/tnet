import type {
  RequesterKeyValueRow,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';

const maxStoredBodyBytes = 1024 * 1024;

const previewTypeForContentType = (
  contentType: string
): RequesterResponseSnapshot['previewType'] => {
  if (contentType.includes('application/json') || contentType.includes('+json')) return 'json';
  if (contentType.startsWith('text/') || contentType.includes('xml')) return 'text';
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.includes('application/pdf')) return 'pdf';
  return 'binary';
};

export const parseRequesterResponse = async (
  response: Response,
  durationMs: number
): Promise<RequesterResponseSnapshot> => {
  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? '';
  const isBodyTruncated = bytes.byteLength > maxStoredBodyBytes;
  const previewBytes = bytes.slice(0, maxStoredBodyBytes);
  const decoder = new TextDecoder('utf-8');
  const headers: RequesterKeyValueRow[] = [...response.headers.entries()].map(([key, value]) => ({
    id: key,
    enabled: true,
    key,
    value
  }));

  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    bodyText: decoder.decode(previewBytes),
    bodyBase64: Buffer.from(previewBytes).toString('base64'),
    contentType,
    byteSize: bytes.byteLength,
    durationMs,
    isBodyTruncated,
    previewType: previewTypeForContentType(contentType)
  };
};
