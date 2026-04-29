import fs from 'fs/promises';
import type { SessionData } from '@tnet/shared/types/file';
import { emptySessionData, normalizeSessionData } from '@tnet/shared/types/file';
import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import { sessionFilePath, tnetDirPath } from '@tnet/main-core/storage/paths';

export const emptySession = (): SessionData => emptySessionData();

export const saveSession = async (rootDir: string, session: SessionData): Promise<void> => {
  if (!rootDir) return;
  await fs.mkdir(tnetDirPath(rootDir), { recursive: true });
  await writeJsonFile(sessionFilePath(rootDir), session);
};

export const loadSession = async (rootDir: string): Promise<SessionData> => {
  if (!rootDir) return emptySession();

  return normalizeSessionData(
    await readJsonFileOrDefault<unknown>(sessionFilePath(rootDir), emptySession())
  );
};
