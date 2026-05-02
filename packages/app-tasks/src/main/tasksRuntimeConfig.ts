import fs from 'fs';
import path from 'path';
import { tasksDataDir, tasksRuntimeLocalConfigPath } from './tasksPaths';

export interface TasksRuntimeConfig {
  calendarHttpUserAgent?: string;
  googleCalendarCredentialsPath?: string;
}

export const loadTasksRuntimeConfig = (userDataDir: string): TasksRuntimeConfig => {
  const configPath = tasksRuntimeLocalConfigPath(userDataDir);
  if (!fs.existsSync(configPath)) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    throw new Error(
      `Failed to read Tasks runtime config at ${configPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Tasks runtime config must be a JSON object: ${configPath}`);
  }

  const config = parsed as Partial<Record<keyof TasksRuntimeConfig, unknown>>;
  return {
    calendarHttpUserAgent: readOptionalString(config.calendarHttpUserAgent),
    googleCalendarCredentialsPath: resolveOptionalPath(
      readOptionalString(config.googleCalendarCredentialsPath),
      tasksDataDir(userDataDir)
    )
  };
};

export const describeTasksRuntimeConfigPath = (userDataDir: string): string =>
  tasksRuntimeLocalConfigPath(userDataDir);

const readOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveOptionalPath = (value: string | undefined, baseDir: string): string | undefined => {
  if (!value) return undefined;
  return path.isAbsolute(value) ? value : path.resolve(baseDir, value);
};
