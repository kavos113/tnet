import type { GlobalConfig } from '@shared/types/config';
import { defaultGlobalConfig } from '@shared/types/config';
import { readJsonFileOrDefault, writeJsonFile } from '@main/storage/jsonFile';
import { globalConfigFilePath } from '@main/storage/paths';

export const loadGlobalConfig = async (userDataDir: string): Promise<GlobalConfig> => {
  return readJsonFileOrDefault(globalConfigFilePath(userDataDir), defaultGlobalConfig());
};

export const saveGlobalConfig = async (
  userDataDir: string,
  config: GlobalConfig
): Promise<void> => {
  await writeJsonFile(globalConfigFilePath(userDataDir), config);
};
