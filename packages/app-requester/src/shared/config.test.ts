import { describe, expect, it } from 'vitest';
import { normalizeRequesterWorkspaceSettings } from './config';

describe('normalizeRequesterWorkspaceSettings', () => {
  it('normalizes proxy and TLS settings', () => {
    const normalized = normalizeRequesterWorkspaceSettings({
      proxyMode: 'http',
      proxyHost: ' proxy.test ',
      proxyPort: 8080.8,
      proxyUsername: 'testuser',
      proxyPasswordSecretId: 'secret-proxy',
      clientCertificatePath: ' C:\\certs\\client.crt ',
      clientCertificateKeyPath: ' C:\\certs\\client.key ',
      clientCertificatePassphraseSecretId: 'secret-cert',
      customCaCertificatePath: ' C:\\certs\\ca.crt '
    });

    expect(normalized).toMatchObject({
      proxyMode: 'http',
      proxyHost: 'proxy.test',
      proxyPort: 8080,
      proxyUsername: 'testuser',
      proxyPasswordSecretId: 'secret-proxy',
      clientCertificatePath: 'C:\\certs\\client.crt',
      clientCertificateKeyPath: 'C:\\certs\\client.key',
      clientCertificatePassphraseSecretId: 'secret-cert',
      customCaCertificatePath: 'C:\\certs\\ca.crt'
    });
  });

  it('falls back to defaults for invalid proxy settings', () => {
    const normalized = normalizeRequesterWorkspaceSettings({
      proxyMode: 'invalid' as never,
      proxyPort: -1,
      proxyPasswordSecretId: ''
    });

    expect(normalized.proxyMode).toBe('system');
    expect(normalized.proxyPort).toBe(0);
    expect(normalized.proxyPasswordSecretId).toBeUndefined();
  });
});
