import type { GlobalConfig } from '@tnet/shared/types/config';
import { defaultGlobalConfig, normalizeGlobalConfig } from '@tnet/shared/types/config';
import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import { globalConfigFilePath } from '@tnet/main-core/storage/paths';

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
