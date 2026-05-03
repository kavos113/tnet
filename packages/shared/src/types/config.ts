import { defaultAppId, type AppId } from '@tnet/shared/app/appTypes';

export interface GlobalConfig {
  activeAppId?: AppId;
  apps?: Partial<Record<AppId, unknown>>;
  fonts?: Partial<GlobalFontSettings>;
}

export interface GlobalFontSettings {
  standardFontFamily: string;
  standardFontSize: number;
  monospaceFontFamily: string;
  monospaceFontSize: number;
}

export const defaultGlobalConfig = (): GlobalConfig => ({
  activeAppId: defaultAppId,
  fonts: defaultGlobalFontSettings(),
  apps: {
    tasks: {},
    markdown: {},
    papers: {},
    requester: {},
    rss: {},
    'db-inspector': {},
    'pdf-viewer': {},
    code: {}
  }
});

export const defaultGlobalFontSettings = (): GlobalFontSettings => ({
  standardFontFamily:
    '"Rounded Mplus 1c", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  standardFontSize: 13,
  monospaceFontFamily: 'monospace',
  monospaceFontSize: 13
});

export const normalizeGlobalConfig = (config: GlobalConfig): GlobalConfig => {
  const defaults = defaultGlobalConfig();

  return {
    ...defaults,
    ...config,
    fonts: normalizeGlobalFontSettings(config.fonts),
    apps: {
      ...defaults.apps,
      ...config.apps
    }
  };
};

export const normalizeGlobalFontSettings = (
  fonts: Partial<GlobalFontSettings> | undefined
): GlobalFontSettings => {
  const defaults = defaultGlobalFontSettings();
  return {
    standardFontFamily: normalizeFontFamily(fonts?.standardFontFamily, defaults.standardFontFamily),
    standardFontSize: normalizeFontSize(fonts?.standardFontSize, defaults.standardFontSize),
    monospaceFontFamily: normalizeFontFamily(
      fonts?.monospaceFontFamily,
      defaults.monospaceFontFamily
    ),
    monospaceFontSize: normalizeFontSize(fonts?.monospaceFontSize, defaults.monospaceFontSize)
  };
};

export const getGlobalFontSettings = (config: GlobalConfig): GlobalFontSettings =>
  normalizeGlobalFontSettings(config.fonts);

export const withGlobalFontSettings = (
  config: GlobalConfig,
  fonts: Partial<GlobalFontSettings>
): GlobalConfig => ({
  ...normalizeGlobalConfig(config),
  fonts: normalizeGlobalFontSettings(fonts)
});

const normalizeFontFamily = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

const normalizeFontSize = (value: number | undefined, fallback: number): number => {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(48, Math.max(8, Math.floor(value)));
};
