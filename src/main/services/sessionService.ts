import fs from 'fs/promises';
import type { SessionData } from '@shared/types/file';
import { readJsonFileOrDefault, writeJsonFile } from '@main/storage/jsonFile';
import { sessionFilePath, tnetDirPath } from '@main/storage/paths';

export const emptySession = (): SessionData => ({
  openedFiles: [],
  expandedFolders: []
});

export const saveSession = async (rootDir: string, session: SessionData): Promise<void> => {
  if (!rootDir) return;
  await fs.mkdir(tnetDirPath(rootDir), { recursive: true });
  await writeJsonFile(sessionFilePath(rootDir), session);
};

export const loadSession = async (rootDir: string): Promise<SessionData> => {
  if (!rootDir) return emptySession();

  const raw = await readJsonFileOrDefault<SessionData | string[]>(sessionFilePath(rootDir), {
    openedFiles: [],
    expandedFolders: []
  });

  if (Array.isArray(raw)) {
    return {
      openedFiles: raw,
      expandedFolders: []
    };
  }

  return raw;
};

export const removePathFromSession = async (rootDir: string, targetPath: string): Promise<void> => {
  if (!rootDir) return;
  const session = await loadSession(rootDir);
  await saveSession(rootDir, {
    openedFiles: session.openedFiles.filter((filePath) => filePath !== targetPath),
    expandedFolders: session.expandedFolders.filter((folderPath) => folderPath !== targetPath)
  });
};

export const replacePathInSession = async (
  rootDir: string,
  oldPath: string,
  newPath: string
): Promise<void> => {
  if (!rootDir) return;
  const session = await loadSession(rootDir);
  await saveSession(rootDir, {
    openedFiles: session.openedFiles.map((filePath) => (filePath === oldPath ? newPath : filePath)),
    expandedFolders: session.expandedFolders.map((folderPath) =>
      folderPath === oldPath ? newPath : folderPath
    )
  });
};
