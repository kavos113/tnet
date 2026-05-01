import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export interface RequesterGlobalConfig {
  activeWorkspaceId?: string;
  lastOpenedWorkspaceId?: string;
  settings?: RequesterGlobalSettings;
}

export interface RequesterGlobalSettings {
  codeFontFamily: string;
  codeFontSize: number;
  appFontFamily: string;
  appFontSize: number;
}

export interface RequesterWorkspaceSettings {
  historyEnabled: boolean;
  saveResponseBody: boolean;
  maxTextResponseBytes: number;
  maxBinaryResponseBytes: number;
  requestTimeoutMs: number;
  followRedirects: boolean;
  validateTlsCertificates: boolean;
  cookieJarEnabled: boolean;
  proxyMode: 'system' | 'none' | 'http' | 'socks';
  proxyHost: string;
  proxyPort: number;
  proxyUsername: string;
  proxyPasswordSecretId?: string;
  clientCertificatePath: string;
  clientCertificateKeyPath: string;
  clientCertificatePassphraseSecretId?: string;
  customCaCertificatePath: string;
  codeFontFamily: string;
  codeFontSize: number;
  appFontFamily: string;
  appFontSize: number;
  expandedRequestPaths: string[];
  requestFolderPaths: string[];
  defaultVariableSetId?: string;
}

export const defaultRequesterGlobalConfig = (): RequesterGlobalConfig => ({});

export const defaultRequesterGlobalSettings = (): RequesterGlobalSettings => ({
  codeFontFamily: '',
  codeFontSize: 0,
  appFontFamily: '',
  appFontSize: 0
});

export const defaultRequesterWorkspaceSettings = (): RequesterWorkspaceSettings => ({
  historyEnabled: true,
  saveResponseBody: true,
  maxTextResponseBytes: 1024 * 1024,
  maxBinaryResponseBytes: 10 * 1024 * 1024,
  requestTimeoutMs: 30000,
  followRedirects: true,
  validateTlsCertificates: true,
  cookieJarEnabled: false,
  proxyMode: 'system',
  proxyHost: '',
  proxyPort: 0,
  proxyUsername: '',
  clientCertificatePath: '',
  clientCertificateKeyPath: '',
  customCaCertificatePath: '',
  codeFontFamily: 'monospace',
  codeFontSize: 13,
  appFontFamily: 'sans-serif',
  appFontSize: 13,
  expandedRequestPaths: [],
  requestFolderPaths: []
});

export const getRequesterGlobalConfig = (config: GlobalConfig): RequesterGlobalConfig => ({
  ...defaultRequesterGlobalConfig(),
  ...(config.apps?.requester as Partial<RequesterGlobalConfig> | undefined)
});

export const getRequesterGlobalSettings = (config: GlobalConfig): RequesterGlobalSettings => {
  const requesterConfig = config.apps?.requester as Partial<RequesterGlobalConfig> | undefined;
  return {
    ...defaultRequesterGlobalSettings(),
    ...requesterConfig?.settings
  };
};

export const withRequesterGlobalConfig = (
  config: GlobalConfig,
  requesterConfig: RequesterGlobalConfig
): GlobalConfig => {
  const normalizedConfig = normalizeGlobalConfig(config);

  return {
    ...normalizedConfig,
    apps: {
      ...normalizedConfig.apps,
      requester: requesterConfig
    }
  };
};

export const withRequesterGlobalSettings = (
  config: GlobalConfig,
  settings: RequesterGlobalSettings
): GlobalConfig => {
  const requesterConfig = getRequesterGlobalConfig(config);
  return withRequesterGlobalConfig(config, {
    ...requesterConfig,
    settings
  });
};

export const normalizeRequesterWorkspaceSettings = (
  settings: Partial<RequesterWorkspaceSettings> = {}
): RequesterWorkspaceSettings => {
  const defaults = defaultRequesterWorkspaceSettings();

  return {
    ...defaults,
    ...settings,
    maxTextResponseBytes:
      settings.maxTextResponseBytes && settings.maxTextResponseBytes > 0
        ? settings.maxTextResponseBytes
        : defaults.maxTextResponseBytes,
    maxBinaryResponseBytes:
      settings.maxBinaryResponseBytes && settings.maxBinaryResponseBytes > 0
        ? settings.maxBinaryResponseBytes
        : defaults.maxBinaryResponseBytes,
    requestTimeoutMs:
      settings.requestTimeoutMs && settings.requestTimeoutMs > 0
        ? settings.requestTimeoutMs
        : defaults.requestTimeoutMs,
    codeFontFamily: settings.codeFontFamily || defaults.codeFontFamily,
    codeFontSize:
      settings.codeFontSize && settings.codeFontSize > 0
        ? settings.codeFontSize
        : defaults.codeFontSize,
    appFontFamily: settings.appFontFamily || defaults.appFontFamily,
    appFontSize:
      settings.appFontSize && settings.appFontSize > 0
        ? settings.appFontSize
        : defaults.appFontSize,
    proxyMode:
      settings.proxyMode === 'none' ||
      settings.proxyMode === 'http' ||
      settings.proxyMode === 'socks'
        ? settings.proxyMode
        : defaults.proxyMode,
    proxyHost: settings.proxyHost?.trim() ?? defaults.proxyHost,
    proxyPort:
      settings.proxyPort && settings.proxyPort > 0
        ? Math.floor(settings.proxyPort)
        : defaults.proxyPort,
    proxyUsername: settings.proxyUsername ?? defaults.proxyUsername,
    proxyPasswordSecretId: settings.proxyPasswordSecretId || undefined,
    clientCertificatePath: settings.clientCertificatePath?.trim() ?? defaults.clientCertificatePath,
    clientCertificateKeyPath:
      settings.clientCertificateKeyPath?.trim() ?? defaults.clientCertificateKeyPath,
    clientCertificatePassphraseSecretId: settings.clientCertificatePassphraseSecretId || undefined,
    customCaCertificatePath:
      settings.customCaCertificatePath?.trim() ?? defaults.customCaCertificatePath,
    expandedRequestPaths: Array.isArray(settings.expandedRequestPaths)
      ? [...new Set(settings.expandedRequestPaths.filter((path) => typeof path === 'string'))]
      : defaults.expandedRequestPaths,
    requestFolderPaths: Array.isArray(settings.requestFolderPaths)
      ? [...new Set(settings.requestFolderPaths.filter((path) => typeof path === 'string'))]
      : defaults.requestFolderPaths
  };
};
