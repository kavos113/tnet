import type { ProjectConfig } from '@shared/types/config';
import { defaultProjectConfig } from '@shared/types/config';
import { readJsonFileOrDefault, writeJsonFile } from '@main/storage/jsonFile';
import { settingsFilePath } from '@main/storage/paths';

export const loadProjectConfig = async (rootDir: string): Promise<ProjectConfig> => {
  if (!rootDir) return defaultProjectConfig();
  return readJsonFileOrDefault(settingsFilePath(rootDir), defaultProjectConfig());
};

export const saveProjectConfig = async (rootDir: string, config: ProjectConfig): Promise<void> => {
  if (!rootDir) return;
  await writeJsonFile(settingsFilePath(rootDir), config);
};
