import path from 'path';

export const tasksDataDir = (userDataDir: string): string => path.join(userDataDir, 'tasks');

export const tasksGlobalConfigPath = (userDataDir: string): string =>
  path.join(tasksDataDir(userDataDir), 'global.json');

export const tasksDatabasePath = (userDataDir: string): string =>
  path.join(tasksDataDir(userDataDir), 'tasks.db');

export const tasksSecretsPath = (userDataDir: string): string =>
  path.join(tasksDataDir(userDataDir), 'secrets.json');
