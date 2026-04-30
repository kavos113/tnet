import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import type { RequesterGlobalConfig } from '@tnet/app-requester/shared/config';
import {
  defaultRequesterGlobalConfig,
  getRequesterGlobalConfig,
  withRequesterGlobalConfig
} from '@tnet/app-requester/shared/config';
import { defaultGlobalConfig } from '@tnet/shared/types/config';
import { requesterGlobalConfigPath } from './requesterPaths';

export const loadRequesterGlobalConfig = async (
  userDataDir: string
): Promise<RequesterGlobalConfig> => {
  const config = await readJsonFileOrDefault(
    requesterGlobalConfigPath(userDataDir),
    defaultRequesterGlobalConfig()
  );

  return {
    ...defaultRequesterGlobalConfig(),
    ...config
  };
};

export const saveRequesterGlobalConfig = async (
  userDataDir: string,
  config: RequesterGlobalConfig
): Promise<void> => {
  await writeJsonFile(requesterGlobalConfigPath(userDataDir), config);
};

export const getRequesterConfigFromGlobalConfig = getRequesterGlobalConfig;
export const withRequesterConfigInGlobalConfig = withRequesterGlobalConfig;
export const defaultRequesterShellConfig = (): ReturnType<typeof defaultGlobalConfig> =>
  withRequesterGlobalConfig(defaultGlobalConfig(), defaultRequesterGlobalConfig());
