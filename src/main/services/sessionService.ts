import fs from 'fs/promises';
import type { SessionData } from '@shared/types/file';
import { emptySessionData, normalizeSessionData } from '@shared/types/file';
import { toWorkspaceRelativePath } from '@shared/path/pathUtils';
import { readJsonFileOrDefault, writeJsonFile } from '@main/storage/jsonFile';
import { sessionFilePath, tnetDirPath } from '@main/storage/paths';

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

export const removePathFromSession = async (rootDir: string, targetPath: string): Promise<void> => {
  if (!rootDir) return;
  const session = await loadSession(rootDir);
  const relativeTargetPath = toWorkspaceRelativePath(rootDir, targetPath);
  const markdownSession = session.apps.markdown;
  const editorLayout = markdownSession.editorLayout
    ? {
        ...markdownSession.editorLayout,
        groups: {
          primary: {
            ...markdownSession.editorLayout.groups.primary,
            openedFiles: markdownSession.editorLayout.groups.primary.openedFiles.filter(
              (filePath) => filePath !== relativeTargetPath
            )
          },
          secondary: {
            ...markdownSession.editorLayout.groups.secondary,
            openedFiles: markdownSession.editorLayout.groups.secondary.openedFiles.filter(
              (filePath) => filePath !== relativeTargetPath
            )
          }
        }
      }
    : undefined;
  await saveSession(rootDir, {
    explorer: {
      ...session.explorer,
      expandedFolders: session.explorer.expandedFolders.filter(
        (folderPath) => folderPath !== relativeTargetPath
      )
    },
    apps: {
      ...session.apps,
      markdown: {
        openedFiles: markdownSession.openedFiles.filter(
          (filePath) => filePath !== relativeTargetPath
        ),
        editorLayout
      }
    }
  });
};

export const replacePathInSession = async (
  rootDir: string,
  oldPath: string,
  newPath: string
): Promise<void> => {
  if (!rootDir) return;
  const session = await loadSession(rootDir);
  const relativeOldPath = toWorkspaceRelativePath(rootDir, oldPath);
  const relativeNewPath = toWorkspaceRelativePath(rootDir, newPath);
  const markdownSession = session.apps.markdown;
  const replacePath = (filePath: string): string =>
    filePath === relativeOldPath ? relativeNewPath : filePath;
  const editorLayout = markdownSession.editorLayout
    ? {
        ...markdownSession.editorLayout,
        groups: {
          primary: {
            ...markdownSession.editorLayout.groups.primary,
            openedFiles: markdownSession.editorLayout.groups.primary.openedFiles.map(replacePath)
          },
          secondary: {
            ...markdownSession.editorLayout.groups.secondary,
            openedFiles: markdownSession.editorLayout.groups.secondary.openedFiles.map(replacePath)
          }
        }
      }
    : undefined;
  await saveSession(rootDir, {
    explorer: {
      ...session.explorer,
      expandedFolders: session.explorer.expandedFolders.map(replacePath)
    },
    apps: {
      ...session.apps,
      markdown: {
        openedFiles: markdownSession.openedFiles.map(replacePath),
        editorLayout
      }
    }
  });
};
