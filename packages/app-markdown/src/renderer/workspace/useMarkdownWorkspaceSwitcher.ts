import { useCallback, useEffect, useRef } from 'react';
import { textByteLength } from '@tnet/shared/file/largeFile';
import { toWorkspaceAbsolutePath } from '@tnet/shared/path/pathUtils';
import { normalizeSessionData } from '@tnet/shared/types/file';
import {
  getMarkdownGlobalConfig,
  normalizeGlobalConfig,
  withMarkdownGlobalConfig
} from '@tnet/shared/types/config';
import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import {
  replaceEditorSession,
  replaceOpenedFiles
} from '@tnet/app-markdown/renderer/editor/editorSlice';
import {
  resetExplorerState,
  setExpandedPaths
} from '@tnet/app-markdown/renderer/explorer/explorerSlice';
import { setSettings, setWorkspace } from '@tnet/app-markdown/renderer/workspace/workspaceSlice';
import { tnetApi } from '@tnet/renderer-core/tnetApi';

interface SwitchMarkdownWorkspaceOptions {
  workspaceRoots?: string[];
  persistGlobalConfig?: boolean;
}

const isMarkdownFilePath = (filePath: string): boolean => filePath.toLowerCase().endsWith('.md');

export const useMarkdownWorkspaceSwitcher = (): {
  switchWorkspace: (rootPath: string, options?: SwitchMarkdownWorkspaceOptions) => Promise<void>;
} => {
  const dispatch = useAppDispatch();
  const workspaceRoots = useAppSelector((state) => state.workspace.workspaceRoots);
  const workspaceRootsRef = useRef(workspaceRoots);
  const searchRebuildTimerRef = useRef<number | null>(null);
  const searchRebuildRootRef = useRef('');

  useEffect(() => {
    workspaceRootsRef.current = workspaceRoots;
  }, [workspaceRoots]);

  useEffect(() => {
    return () => {
      if (searchRebuildTimerRef.current !== null) {
        window.clearTimeout(searchRebuildTimerRef.current);
      }
    };
  }, []);

  const switchWorkspace = useCallback(
    async (rootPath: string, options: SwitchMarkdownWorkspaceOptions = {}): Promise<void> => {
      if (!rootPath) return;

      const nextWorkspaceRoots = Array.from(
        new Set([...(options.workspaceRoots ?? workspaceRootsRef.current), rootPath])
      );
      const [fileTree, settings, rawSession] = await Promise.all([
        tnetApi.workspace.getFileTree(rootPath),
        tnetApi.config.loadProject(rootPath),
        tnetApi.session.load(rootPath)
      ]);
      const session = normalizeSessionData(rawSession);
      const markdownSession = session.apps.markdown;
      const sessionFilePaths = markdownSession.editorLayout
        ? Array.from(
            new Set([
              ...markdownSession.editorLayout.groups.primary.openedFiles,
              ...markdownSession.editorLayout.groups.secondary.openedFiles
            ])
          )
        : markdownSession.openedFiles;
      const restorableFilePaths = sessionFilePaths.filter(isMarkdownFilePath);
      const openedFiles = (
        await Promise.all(
          restorableFilePaths.map(async (filePath) => {
            try {
              const content = await tnetApi.file.read({
                rootDir: rootPath,
                path: filePath
              });
              return {
                path: toWorkspaceAbsolutePath(rootPath, filePath),
                content,
                sizeBytes: textByteLength(content)
              };
            } catch (error: unknown) {
              console.error('Failed to restore opened markdown file', error);
              return null;
            }
          })
        )
      ).filter(
        (file): file is { path: string; content: string; sizeBytes: number } => file !== null
      );

      dispatch(setWorkspace({ rootPath, fileTree, workspaceRoots: nextWorkspaceRoots }));
      dispatch(setSettings(settings));
      dispatch(resetExplorerState());
      dispatch(
        setExpandedPaths(
          session.explorer.expandedFolders.map((folderPath) =>
            toWorkspaceAbsolutePath(rootPath, folderPath)
          )
        )
      );
      if (markdownSession.editorLayout) {
        const primaryTabs = markdownSession.editorLayout.groups.primary.openedFiles
          .filter(isMarkdownFilePath)
          .map((filePath) => toWorkspaceAbsolutePath(rootPath, filePath));
        const secondaryTabs = markdownSession.editorLayout.groups.secondary.openedFiles
          .filter(isMarkdownFilePath)
          .map((filePath) => toWorkspaceAbsolutePath(rootPath, filePath));
        dispatch(
          replaceEditorSession({
            files: openedFiles,
            activeGroupId: markdownSession.editorLayout.activeGroupId,
            isSecondaryGroupVisible: markdownSession.editorLayout.isSecondaryGroupVisible,
            groupWidthPercent: markdownSession.editorLayout.groupWidthPercent,
            groups: {
              primary: {
                tabs: primaryTabs,
                activeIndex:
                  primaryTabs.length === 0
                    ? -1
                    : Math.min(
                        markdownSession.editorLayout.groups.primary.activeIndex,
                        primaryTabs.length - 1
                      ),
                viewMode: markdownSession.editorLayout.groups.primary.viewMode,
                isPreviewOutlineVisible:
                  markdownSession.editorLayout.groups.primary.isPreviewOutlineVisible
              },
              secondary: {
                tabs: secondaryTabs,
                activeIndex:
                  secondaryTabs.length === 0
                    ? -1
                    : Math.min(
                        markdownSession.editorLayout.groups.secondary.activeIndex,
                        secondaryTabs.length - 1
                      ),
                viewMode: markdownSession.editorLayout.groups.secondary.viewMode,
                isPreviewOutlineVisible:
                  markdownSession.editorLayout.groups.secondary.isPreviewOutlineVisible
              }
            }
          })
        );
      } else {
        dispatch(replaceOpenedFiles({ openedFiles, activeIndex: openedFiles.length - 1 }));
      }
      if (searchRebuildTimerRef.current !== null) {
        window.clearTimeout(searchRebuildTimerRef.current);
      }
      searchRebuildRootRef.current = rootPath;
      searchRebuildTimerRef.current = window.setTimeout(() => {
        if (searchRebuildRootRef.current !== rootPath) return;
        tnetApi.search.rebuild(rootPath).catch((error: unknown) => {
          console.error('Failed to rebuild markdown search index', error);
        });
      }, 500);

      if (options.persistGlobalConfig !== false) {
        const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
        const markdownConfig = getMarkdownGlobalConfig(config);
        await tnetApi.config.saveGlobal(
          withMarkdownGlobalConfig(
            {
              ...config,
              activeAppId: 'markdown'
            },
            {
              ...markdownConfig,
              lastOpenedDirectory: rootPath,
              activeWorkspaceRoot: rootPath,
              workspaceRoots: nextWorkspaceRoots
            }
          )
        );
      }
    },
    [dispatch]
  );

  return { switchWorkspace };
};
