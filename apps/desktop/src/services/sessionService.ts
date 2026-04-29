import fs from 'fs/promises';
import type { MarkdownSessionData } from '@tnet/app-markdown/shared/session';
import {
  emptyMarkdownSessionData,
  normalizeMarkdownSessionData
} from '@tnet/app-markdown/shared/session';
import { readJsonFileOrDefault, writeJsonFile } from '@tnet/main-core/storage/jsonFile';
import { sessionFilePath, tnetDirPath } from '@tnet/main-core/storage/paths';

export const emptySession = (): MarkdownSessionData => emptyMarkdownSessionData();

export const saveSession = async (rootDir: string, session: MarkdownSessionData): Promise<void> => {
  if (!rootDir) return;
  await fs.mkdir(tnetDirPath(rootDir), { recursive: true });
  await writeJsonFile(sessionFilePath(rootDir), session);
};

export const loadSession = async (rootDir: string): Promise<MarkdownSessionData> => {
  if (!rootDir) return emptySession();

  return normalizeMarkdownSessionData(
    await readJsonFileOrDefault<unknown>(sessionFilePath(rootDir), emptySession())
  );
};
