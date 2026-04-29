import path from 'path';

export const papersDataDir = (libraryRoot: string): string =>
  path.join(libraryRoot, '.tnet', 'papers');

export const papersSettingsPath = (libraryRoot: string): string =>
  path.join(papersDataDir(libraryRoot), 'settings.json');

export const papersDatabasePath = (libraryRoot: string): string =>
  path.join(papersDataDir(libraryRoot), 'papers.db');
