import path from 'path';

export const papersDataDir = (libraryRoot: string): string =>
  path.join(libraryRoot, '.tnet', 'papers');

export const papersSettingsPath = (libraryRoot: string): string =>
  path.join(papersDataDir(libraryRoot), 'settings.json');

export const papersDatabasePath = (libraryRoot: string): string =>
  path.join(papersDataDir(libraryRoot), 'papers.db');

export const papersImportedPdfDir = (libraryRoot: string): string =>
  path.join(libraryRoot, 'papers');

export const toPapersRelativePath = (libraryRoot: string, absolutePath: string): string =>
  path.relative(libraryRoot, absolutePath).split(path.sep).join('/');

export const resolvePapersRelativePath = (libraryRoot: string, relativePath: string): string =>
  path.resolve(libraryRoot, relativePath);
