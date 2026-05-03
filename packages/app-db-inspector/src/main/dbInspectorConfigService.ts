import { loadNormalizedJsonConfig, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import type { DbInspectorGlobalConfig } from '@tnet/app-db-inspector/shared/config';
import { defaultDbInspectorGlobalConfig } from '@tnet/app-db-inspector/shared/config';
import { dbInspectorGlobalConfigPath } from './dbInspectorPaths';

const normalizeDbInspectorGlobalConfig = (
  config: Partial<DbInspectorGlobalConfig> = {}
): DbInspectorGlobalConfig => ({
  ...defaultDbInspectorGlobalConfig(),
  ...config
});

export const loadDbInspectorGlobalConfig = async (
  userDataDir: string
): Promise<DbInspectorGlobalConfig> =>
  loadNormalizedJsonConfig({
    filePath: dbInspectorGlobalConfigPath(userDataDir),
    defaultValue: defaultDbInspectorGlobalConfig(),
    normalize: normalizeDbInspectorGlobalConfig
  });

export const saveDbInspectorGlobalConfig = (
  userDataDir: string,
  config: DbInspectorGlobalConfig
): Promise<void> =>
  writeJsonFile(dbInspectorGlobalConfigPath(userDataDir), normalizeDbInspectorGlobalConfig(config));
