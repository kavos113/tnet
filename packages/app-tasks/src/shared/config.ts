import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export type TasksDefaultView = 'today' | 'week' | 'month';
export type TasksTimeFormat = '12h' | '24h';
export type TasksClockSize = 'compact' | 'large';
export type TasksCompletedTaskScope = 'today' | 'all';
export type TasksWeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TasksGlobalConfig {
  settings?: TasksGlobalSettings;
}

export interface TasksGlobalSettings {
  weekStartsOn: TasksWeekStartDay;
  timeFormat: TasksTimeFormat;
  defaultView: TasksDefaultView;
  clockSize: TasksClockSize;
  completedTaskScope: TasksCompletedTaskScope;
  syncIntervalMinutes: number;
  showPortal: boolean;
  categoryCompletionEnabled: boolean;
  categoryColors: Record<string, string>;
}

export const defaultTasksGlobalConfig = (): TasksGlobalConfig => ({});

export const defaultTasksGlobalSettings = (): TasksGlobalSettings => ({
  weekStartsOn: 1,
  timeFormat: '24h',
  defaultView: 'month',
  clockSize: 'large',
  completedTaskScope: 'all',
  syncIntervalMinutes: 60,
  showPortal: true,
  categoryCompletionEnabled: true,
  categoryColors: {}
});

export const getTasksGlobalConfig = (config: GlobalConfig): TasksGlobalConfig => ({
  ...defaultTasksGlobalConfig(),
  ...(config.apps?.tasks as Partial<TasksGlobalConfig> | undefined)
});

export const getTasksGlobalSettings = (config: GlobalConfig): TasksGlobalSettings =>
  normalizeTasksGlobalSettings(
    (config.apps?.tasks as Partial<TasksGlobalConfig> | undefined)?.settings
  );

export const withTasksGlobalConfig = (
  config: GlobalConfig,
  tasksConfig: TasksGlobalConfig
): GlobalConfig => {
  const normalizedConfig = normalizeGlobalConfig(config);
  return {
    ...normalizedConfig,
    apps: {
      ...normalizedConfig.apps,
      tasks: tasksConfig
    }
  };
};

export const withTasksGlobalSettings = (
  config: GlobalConfig,
  settings: Partial<TasksGlobalSettings>
): GlobalConfig => {
  const tasksConfig = getTasksGlobalConfig(config);
  return withTasksGlobalConfig(config, {
    ...tasksConfig,
    settings: normalizeTasksGlobalSettings(settings)
  });
};

export const normalizeTasksGlobalSettings = (
  settings: Partial<TasksGlobalSettings> = {}
): TasksGlobalSettings => {
  const defaults = defaultTasksGlobalSettings();
  const weekStartsOn = Number(settings.weekStartsOn);
  const syncIntervalMinutes = Number(settings.syncIntervalMinutes);

  return {
    ...defaults,
    ...settings,
    weekStartsOn: isValidWeekStartDay(weekStartsOn)
      ? (weekStartsOn as TasksWeekStartDay)
      : defaults.weekStartsOn,
    timeFormat:
      settings.timeFormat === '12h' || settings.timeFormat === '24h'
        ? settings.timeFormat
        : defaults.timeFormat,
    defaultView:
      settings.defaultView === 'today' ||
      settings.defaultView === 'week' ||
      settings.defaultView === 'month'
        ? settings.defaultView
        : defaults.defaultView,
    clockSize:
      settings.clockSize === 'compact' || settings.clockSize === 'large'
        ? settings.clockSize
        : defaults.clockSize,
    completedTaskScope:
      settings.completedTaskScope === 'today' || settings.completedTaskScope === 'all'
        ? settings.completedTaskScope
        : defaults.completedTaskScope,
    syncIntervalMinutes:
      Number.isFinite(syncIntervalMinutes) && syncIntervalMinutes > 0
        ? Math.min(1440, Math.max(5, Math.floor(syncIntervalMinutes)))
        : defaults.syncIntervalMinutes,
    showPortal: settings.showPortal ?? defaults.showPortal,
    categoryCompletionEnabled:
      settings.categoryCompletionEnabled ?? defaults.categoryCompletionEnabled,
    categoryColors: normalizeCategoryColors(settings.categoryColors)
  };
};

const isValidWeekStartDay = (value: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= 6;

const normalizeCategoryColors = (colors: unknown): Record<string, string> => {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors)) return {};

  return Object.entries(colors).reduce<Record<string, string>>((result, [category, color]) => {
    const normalizedCategory = category.trim();
    if (!normalizedCategory || typeof color !== 'string') return result;

    const normalizedColor = color.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(normalizedColor)) return result;

    result[normalizedCategory] = normalizedColor;
    return result;
  }, {});
};
