import fs from 'fs';
import path from 'path';
import type { DbInspectorGlobalConfig } from '@tnet/app-db-inspector/shared/config';
import { defaultDbInspectorGlobalConfig } from '@tnet/app-db-inspector/shared/config';
import { dbInspectorGlobalConfigPath } from './dbInspectorPaths';

export const loadDbInspectorGlobalConfig = (userDataDir: string): DbInspectorGlobalConfig => {
  const configPath = dbInspectorGlobalConfigPath(userDataDir);
  if (!fs.existsSync(configPath)) return defaultDbInspectorGlobalConfig();
  return {
    ...defaultDbInspectorGlobalConfig(),
    ...(JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<DbInspectorGlobalConfig>)
  };
};

export const saveDbInspectorGlobalConfig = (
  userDataDir: string,
  config: DbInspectorGlobalConfig
): void => {
  const configPath = dbInspectorGlobalConfigPath(userDataDir);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
};
