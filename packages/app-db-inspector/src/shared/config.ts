import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export interface DbInspectorGlobalConfig {
  activeWorkspaceId?: string;
  lastOpenedWorkspaceId?: string;
  settings?: DbInspectorGlobalSettings;
}

export interface DbInspectorGlobalSettings {
  queryFontFamily: string;
  queryFontSize: number;
  gridFontFamily: string;
  gridFontSize: number;
  defaultPageSize: number;
}

export interface DbInspectorWorkspaceSettings {
  defaultSchema?: string;
  tablePageSize: number;
  queryTimeoutMs: number;
  readOnlyMode: boolean;
  autoRefreshSchema: boolean;
  showSystemSchemas: boolean;
}

export const defaultDbInspectorGlobalConfig = (): DbInspectorGlobalConfig => ({});

export const defaultDbInspectorGlobalSettings = (): DbInspectorGlobalSettings => ({
  queryFontFamily: '',
  queryFontSize: 0,
  gridFontFamily: '',
  gridFontSize: 0,
  defaultPageSize: 100
});

export const defaultDbInspectorWorkspaceSettings = (): DbInspectorWorkspaceSettings => ({
  tablePageSize: 100,
  queryTimeoutMs: 30000,
  readOnlyMode: true,
  autoRefreshSchema: true,
  showSystemSchemas: false
});

export const getDbInspectorGlobalConfig = (config: GlobalConfig): DbInspectorGlobalConfig => ({
  ...defaultDbInspectorGlobalConfig(),
  ...(config.apps?.['db-inspector'] as Partial<DbInspectorGlobalConfig> | undefined)
});

export const getDbInspectorGlobalSettings = (config: GlobalConfig): DbInspectorGlobalSettings => {
  const dbInspectorConfig = config.apps?.['db-inspector'] as
    | Partial<DbInspectorGlobalConfig>
    | undefined;
  return {
    ...defaultDbInspectorGlobalSettings(),
    ...dbInspectorConfig?.settings
  };
};

export const withDbInspectorGlobalConfig = (
  config: GlobalConfig,
  dbInspectorConfig: DbInspectorGlobalConfig
): GlobalConfig => {
  const normalizedConfig = normalizeGlobalConfig(config);
  return {
    ...normalizedConfig,
    apps: {
      ...normalizedConfig.apps,
      'db-inspector': dbInspectorConfig
    }
  };
};

export const withDbInspectorGlobalSettings = (
  config: GlobalConfig,
  settings: DbInspectorGlobalSettings
): GlobalConfig =>
  withDbInspectorGlobalConfig(config, {
    ...getDbInspectorGlobalConfig(config),
    settings
  });

export const normalizeDbInspectorWorkspaceSettings = (
  settings: Partial<DbInspectorWorkspaceSettings> = {}
): DbInspectorWorkspaceSettings => {
  const defaults = defaultDbInspectorWorkspaceSettings();
  return {
    ...defaults,
    ...settings,
    defaultSchema: settings.defaultSchema?.trim() || undefined,
    tablePageSize:
      settings.tablePageSize && settings.tablePageSize > 0
        ? Math.floor(settings.tablePageSize)
        : defaults.tablePageSize,
    queryTimeoutMs:
      settings.queryTimeoutMs && settings.queryTimeoutMs > 0
        ? Math.floor(settings.queryTimeoutMs)
        : defaults.queryTimeoutMs,
    readOnlyMode: settings.readOnlyMode ?? defaults.readOnlyMode,
    autoRefreshSchema: settings.autoRefreshSchema ?? defaults.autoRefreshSchema,
    showSystemSchemas: settings.showSystemSchemas ?? defaults.showSystemSchemas
  };
};
