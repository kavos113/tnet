import path from 'path';

export const rssDataDir = (userDataDir: string): string => path.join(userDataDir, 'rss');
export const rssDatabasePath = (userDataDir: string): string =>
  path.join(rssDataDir(userDataDir), 'rss.db');
export const rssGlobalConfigPath = (userDataDir: string): string =>
  path.join(rssDataDir(userDataDir), 'config.json');
