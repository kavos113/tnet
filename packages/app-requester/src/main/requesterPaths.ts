import path from 'path';

export const requesterDataDir = (userDataDir: string): string =>
  path.join(userDataDir, 'requester');

export const requesterGlobalConfigPath = (userDataDir: string): string =>
  path.join(requesterDataDir(userDataDir), 'global.json');
