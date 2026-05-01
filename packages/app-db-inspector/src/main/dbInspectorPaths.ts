import path from 'path';

export const dbInspectorDataDir = (userDataDir: string): string =>
  path.join(userDataDir, 'db-inspector');

export const dbInspectorGlobalConfigPath = (userDataDir: string): string =>
  path.join(dbInspectorDataDir(userDataDir), 'global.json');

export const dbInspectorDatabasePath = (userDataDir: string): string =>
  path.join(dbInspectorDataDir(userDataDir), 'db-inspector.db');
