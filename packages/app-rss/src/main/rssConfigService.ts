import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import type { RssGlobalConfig } from '@tnet/app-rss/shared/config';
import { defaultRssGlobalConfig, normalizeRssGlobalConfig } from '@tnet/app-rss/shared/config';
import { rssGlobalConfigPath } from './rssPaths';

export const loadRssGlobalConfig = async (userDataDir: string): Promise<RssGlobalConfig> => {
  const config = await readJsonFileOrDefault(
    rssGlobalConfigPath(userDataDir),
    defaultRssGlobalConfig()
  );
  return normalizeRssGlobalConfig(config);
};

export const saveRssGlobalConfig = async (
  userDataDir: string,
  config: RssGlobalConfig
): Promise<void> => {
  await writeJsonFile(rssGlobalConfigPath(userDataDir), normalizeRssGlobalConfig(config));
};
