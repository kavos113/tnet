import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export interface RequesterGlobalConfig {
  activeWorkspaceId?: string;
  lastOpenedWorkspaceId?: string;
}

export interface RequesterWorkspaceSettings {
  historyEnabled: boolean;
  saveResponseBody: boolean;
  maxTextResponseBytes: number;
  maxBinaryResponseBytes: number;
  requestTimeoutMs: number;
  followRedirects: boolean;
  validateTlsCertificates: boolean;
  codeFontFamily: string;
  codeFontSize: number;
  appFontFamily: string;
  appFontSize: number;
  defaultVariableSetId?: string;
}

export const defaultRequesterGlobalConfig = (): RequesterGlobalConfig => ({});

export const defaultRequesterWorkspaceSettings = (): RequesterWorkspaceSettings => ({
  historyEnabled: true,
  saveResponseBody: true,
  maxTextResponseBytes: 1024 * 1024,
  maxBinaryResponseBytes: 10 * 1024 * 1024,
  requestTimeoutMs: 30000,
  followRedirects: true,
  validateTlsCertificates: true,
  codeFontFamily: 'monospace',
  codeFontSize: 13,
  appFontFamily: 'sans-serif',
  appFontSize: 13
});

export const getRequesterGlobalConfig = (config: GlobalConfig): RequesterGlobalConfig => ({
  ...defaultRequesterGlobalConfig(),
  ...((config.apps?.requester as Partial<RequesterGlobalConfig> | undefined) ?? {})
});

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
      settings.appFontSize && settings.appFontSize > 0 ? settings.appFontSize : defaults.appFontSize
  };
};
