import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { SessionData } from '@tnet/shared/types/file';

type PersistSession = (rootDir: string, session: SessionData) => Promise<void>;
type ReadSession = (rootDir: string) => Promise<SessionData>;

export interface MarkdownSessionFileStateStore {
  loadSession: ReadSession;
  saveSession: PersistSession;
}

export const removePathFromMarkdownSession = async (
  rootDir: string,
  targetPath: string,
  sessionStore: MarkdownSessionFileStateStore
): Promise<void> => {
  if (!rootDir) return;
  const session = await sessionStore.loadSession(rootDir);
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

  await sessionStore.saveSession(rootDir, {
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

export const replacePathInMarkdownSession = async (
  rootDir: string,
  oldPath: string,
  newPath: string,
  sessionStore: MarkdownSessionFileStateStore
): Promise<void> => {
  if (!rootDir) return;
  const session = await sessionStore.loadSession(rootDir);
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

  await sessionStore.saveSession(rootDir, {
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
