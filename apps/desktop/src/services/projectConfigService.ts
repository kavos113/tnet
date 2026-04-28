import type { ProjectConfig } from '@tnet/shared/types/config';
import { defaultProjectConfig, normalizeProjectConfig } from '@tnet/shared/types/config';
import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import { settingsFilePath } from '@tnet/main-core/storage/paths';

export const loadProjectConfig = async (rootDir: string): Promise<ProjectConfig> => {
  if (!rootDir) return defaultProjectConfig();
  return normalizeProjectConfig(
    await readJsonFileOrDefault<Partial<ProjectConfig>>(settingsFilePath(rootDir), {})
  );
};

export const saveProjectConfig = async (rootDir: string, config: ProjectConfig): Promise<void> => {
  if (!rootDir) return;
  await writeJsonFile(settingsFilePath(rootDir), config);
};
