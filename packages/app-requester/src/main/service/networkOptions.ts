import type {
  RequesterNetworkOptions,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';

export const buildRequesterNetworkOptions = (
  request: SaveRequesterRequestInput
): RequesterNetworkOptions => ({
  validateTlsCertificates: request.validateTlsCertificates !== false,
  proxy: {
    mode: request.proxyMode ?? 'system',
    host: request.proxyHost || undefined,
    port: request.proxyPort && request.proxyPort > 0 ? request.proxyPort : undefined,
    username: request.proxyUsername || undefined,
    passwordSecretId: request.proxyPasswordSecretId || undefined
  },
  tls: {
    clientCertificatePath: request.clientCertificatePath || undefined,
    clientCertificateKeyPath: request.clientCertificateKeyPath || undefined,
    clientCertificatePassphraseSecretId: request.clientCertificatePassphraseSecretId || undefined,
    customCaCertificatePath: request.customCaCertificatePath || undefined
  }
});
