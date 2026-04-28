import type { GlobalConfig } from '@shared/types/config';
import { defaultGlobalConfig, normalizeGlobalConfig } from '@shared/types/config';
import { readJsonFileOrDefault, writeJsonFile } from '@main/storage/jsonFile';
import { globalConfigFilePath } from '@main/storage/paths';

export const loadGlobalConfig = async (userDataDir: string): Promise<GlobalConfig> => {
  const config = await readJsonFileOrDefault(
    globalConfigFilePath(userDataDir),
    defaultGlobalConfig()
  );

  return normalizeGlobalConfig(config);
};

export const saveGlobalConfig = async (
  userDataDir: string,
  config: GlobalConfig
): Promise<void> => {
  await writeJsonFile(globalConfigFilePath(userDataDir), config);
};
