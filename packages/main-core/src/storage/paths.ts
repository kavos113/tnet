import path from 'path';

export const tnetDirName = '.tnet';
export const sessionFileName = 'session.json';
export const keywordsFileName = 'keywords.json';
export const settingsFileName = 'settings.json';
export const latestFileName = 'latest.json';
export const globalConfigFileName = 'config.json';

export const tnetDirPath = (rootDir: string): string => path.join(rootDir, tnetDirName);
export const sessionFilePath = (rootDir: string): string =>
  path.join(tnetDirPath(rootDir), sessionFileName);
export const keywordsFilePath = (rootDir: string): string =>
  path.join(tnetDirPath(rootDir), keywordsFileName);
export const settingsFilePath = (rootDir: string): string =>
  path.join(tnetDirPath(rootDir), settingsFileName);
export const latestFilePath = (rootDir: string): string =>
  path.join(tnetDirPath(rootDir), latestFileName);
export const globalConfigFilePath = (userDataDir: string): string =>
  path.join(userDataDir, globalConfigFileName);
