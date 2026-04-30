import type { SaveRequesterRequestInput } from '@tnet/app-requester/shared/requesterTypes';

const sensitiveHeaderNames = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'proxy-authorization'
]);
const redactedValue = '********';

export const redactRequesterRequest = (
  request: SaveRequesterRequestInput
): SaveRequesterRequestInput => ({
  ...request,
  authPassword: request.authPassword ? redactedValue : request.authPassword,
  authToken: request.authToken ? redactedValue : request.authToken,
  authApiKeyValue: request.authApiKeyValue ? redactedValue : request.authApiKeyValue,
  headers: request.headers?.map((header) =>
    sensitiveHeaderNames.has(header.key.trim().toLowerCase())
      ? { ...header, value: redactedValue }
      : header
  )
});
