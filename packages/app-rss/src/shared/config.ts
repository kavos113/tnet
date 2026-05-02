import type { GlobalConfig } from '@tnet/shared/types/config';

export type RssDefaultFilter = 'all' | 'unread';

export interface RssGlobalSettings {
  syncIntervalMinutes: number;
  fetchTimeoutSeconds: number;
  syncOnStartup: boolean;
  retentionDays: number;
  defaultFilter: RssDefaultFilter;
  markReadOnOpen: boolean;
  confirmExternalLinks: boolean;
}

export interface RssGlobalConfig {
  settings: RssGlobalSettings;
}

export const defaultRssGlobalSettings = (): RssGlobalSettings => ({
  syncIntervalMinutes: 30,
  fetchTimeoutSeconds: 20,
  syncOnStartup: true,
  retentionDays: 180,
  defaultFilter: 'unread',
  markReadOnOpen: true,
  confirmExternalLinks: false
});

export const defaultRssGlobalConfig = (): RssGlobalConfig => ({
  settings: defaultRssGlobalSettings()
});

export const normalizeRssGlobalSettings = (
  settings: Partial<RssGlobalSettings> | undefined
): RssGlobalSettings => {
  const defaults = defaultRssGlobalSettings();
  return {
    syncIntervalMinutes: normalizeInteger(
      settings?.syncIntervalMinutes,
      5,
      24 * 60,
      defaults.syncIntervalMinutes
    ),
    fetchTimeoutSeconds: normalizeInteger(
      settings?.fetchTimeoutSeconds,
      3,
      120,
      defaults.fetchTimeoutSeconds
    ),
    syncOnStartup: settings?.syncOnStartup ?? defaults.syncOnStartup,
    retentionDays: normalizeInteger(settings?.retentionDays, 1, 3650, defaults.retentionDays),
    defaultFilter: settings?.defaultFilter === 'all' ? 'all' : defaults.defaultFilter,
    markReadOnOpen: settings?.markReadOnOpen ?? defaults.markReadOnOpen,
    confirmExternalLinks: settings?.confirmExternalLinks ?? defaults.confirmExternalLinks
  };
};

export const normalizeRssGlobalConfig = (
  config: Partial<RssGlobalConfig> | undefined
): RssGlobalConfig => ({
  settings: normalizeRssGlobalSettings(config?.settings)
});

export const getRssGlobalConfig = (globalConfig: GlobalConfig): RssGlobalConfig =>
  normalizeRssGlobalConfig(globalConfig.apps?.rss as Partial<RssGlobalConfig> | undefined);

export const getRssGlobalSettings = (globalConfig: GlobalConfig): RssGlobalSettings =>
  getRssGlobalConfig(globalConfig).settings;

export const withRssGlobalSettings = (
  globalConfig: GlobalConfig,
  settings: RssGlobalSettings
): GlobalConfig => ({
  ...globalConfig,
  apps: {
    ...globalConfig.apps,
    rss: {
      ...getRssGlobalConfig(globalConfig),
      settings: normalizeRssGlobalSettings(settings)
    }
  }
});

const normalizeInteger = (
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
};
