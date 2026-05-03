import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig } from '@tnet/shared/types/config';
import {
  defaultRequesterGlobalConfig,
  defaultRequesterGlobalSettings,
  defaultRequesterWorkspaceSettings,
  getRequesterGlobalConfig,
  getRequesterGlobalSettings,
  normalizeRequesterWorkspaceSettings,
  withRequesterGlobalConfig,
  withRequesterGlobalSettings
} from './config';

describe('requester global config', () => {
  it('reads and writes requester app config', () => {
    const globalConfig = defaultGlobalConfig();
    expect(getRequesterGlobalConfig(globalConfig)).toEqual(defaultRequesterGlobalConfig());
    expect(getRequesterGlobalSettings(globalConfig)).toEqual(defaultRequesterGlobalSettings());

    const withConfig = withRequesterGlobalConfig(globalConfig, {
      activeWorkspaceId: 'workspace-1',
      lastOpenedWorkspaceId: 'workspace-0'
    });
    expect(getRequesterGlobalConfig(withConfig)).toMatchObject({
      activeWorkspaceId: 'workspace-1',
      lastOpenedWorkspaceId: 'workspace-0'
    });

    const withSettings = withRequesterGlobalSettings(withConfig, {
      codeFontFamily: 'JetBrains Mono',
      codeFontSize: 14,
      appFontFamily: 'Inter',
      appFontSize: 15
    });
    expect(getRequesterGlobalSettings(withSettings)).toEqual({
      codeFontFamily: 'JetBrains Mono',
      codeFontSize: 14,
      appFontFamily: 'Inter',
      appFontSize: 15
    });
  });
});

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

  it('falls back to default numeric and font settings', () => {
    const defaults = defaultRequesterWorkspaceSettings();
    const normalized = normalizeRequesterWorkspaceSettings({
      maxTextResponseBytes: 0,
      maxBinaryResponseBytes: -1,
      requestTimeoutMs: Number.NaN,
      codeFontFamily: '',
      codeFontSize: 0,
      appFontFamily: '',
      appFontSize: -1
    });

    expect(normalized).toMatchObject({
      maxTextResponseBytes: defaults.maxTextResponseBytes,
      maxBinaryResponseBytes: defaults.maxBinaryResponseBytes,
      requestTimeoutMs: defaults.requestTimeoutMs,
      codeFontFamily: defaults.codeFontFamily,
      codeFontSize: defaults.codeFontSize,
      appFontFamily: defaults.appFontFamily,
      appFontSize: defaults.appFontSize
    });
  });

  it('deduplicates string path lists and ignores non-string values', () => {
    const normalized = normalizeRequesterWorkspaceSettings({
      expandedRequestPaths: ['GET /users', 'GET /users', 1 as never, 'POST /users'],
      requestFolderPaths: ['auth', false as never, 'auth', 'billing']
    });

    expect(normalized.expandedRequestPaths).toEqual(['GET /users', 'POST /users']);
    expect(normalized.requestFolderPaths).toEqual(['auth', 'billing']);
  });

  it('keeps undefined path lists at their defaults', () => {
    const normalized = normalizeRequesterWorkspaceSettings({
      expandedRequestPaths: undefined,
      requestFolderPaths: undefined,
      proxyHost: undefined,
      proxyUsername: undefined,
      clientCertificatePath: undefined,
      clientCertificateKeyPath: undefined,
      clientCertificatePassphraseSecretId: '',
      customCaCertificatePath: undefined
    });

    expect(normalized.expandedRequestPaths).toEqual([]);
    expect(normalized.requestFolderPaths).toEqual([]);
    expect(normalized.proxyHost).toBe('');
    expect(normalized.proxyUsername).toBe('');
    expect(normalized.clientCertificatePassphraseSecretId).toBeUndefined();
  });
});
