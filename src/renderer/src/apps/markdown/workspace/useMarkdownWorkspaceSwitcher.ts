import { useCallback, useEffect, useRef } from 'react';
import { textByteLength } from '@shared/file/largeFile';
import { toWorkspaceRelativePath } from '@shared/path/pathUtils';
import {
  getMarkdownGlobalConfig,
  normalizeGlobalConfig,
  withMarkdownGlobalConfig
} from '@shared/types/config';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import {
  replaceEditorSession,
  replaceOpenedFiles
} from '@renderer/apps/markdown/editor/editorSlice';
import {
  resetExplorerState,
  setExpandedPaths
} from '@renderer/apps/markdown/explorer/explorerSlice';
import { setSettings, setWorkspace } from '@renderer/features/workspace/workspaceSlice';
import { tnetApi } from '@renderer/lib/tnetApi';

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
      const [fileTree, settings, session] = await Promise.all([
        tnetApi.workspace.getFileTree(rootPath),
        tnetApi.config.loadProject(rootPath),
        tnetApi.session.load(rootPath)
      ]);
      const sessionFilePaths = session.editorLayout
        ? Array.from(
            new Set([
              ...session.editorLayout.groups.primary.openedFiles,
              ...session.editorLayout.groups.secondary.openedFiles
            ])
          )
        : session.openedFiles;
      const restorableFilePaths = sessionFilePaths.filter(isMarkdownFilePath);
      const openedFiles = (
        await Promise.all(
          restorableFilePaths.map(async (filePath) => {
            try {
              const content = await tnetApi.file.read({
                rootDir: rootPath,
                path: toWorkspaceRelativePath(rootPath, filePath)
              });
              return {
                path: filePath,
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
      dispatch(setExpandedPaths(session.expandedFolders));
      if (session.editorLayout) {
        const primaryTabs =
          session.editorLayout.groups.primary.openedFiles.filter(isMarkdownFilePath);
        const secondaryTabs =
          session.editorLayout.groups.secondary.openedFiles.filter(isMarkdownFilePath);
        dispatch(
          replaceEditorSession({
            files: openedFiles,
            activeGroupId: session.editorLayout.activeGroupId,
            isSecondaryGroupVisible: session.editorLayout.isSecondaryGroupVisible,
            groupWidthPercent: session.editorLayout.groupWidthPercent,
            groups: {
              primary: {
                tabs: primaryTabs,
                activeIndex:
                  primaryTabs.length === 0
                    ? -1
                    : Math.min(
                        session.editorLayout.groups.primary.activeIndex,
                        primaryTabs.length - 1
                      ),
                viewMode: session.editorLayout.groups.primary.viewMode,
                isPreviewOutlineVisible: session.editorLayout.groups.primary.isPreviewOutlineVisible
              },
              secondary: {
                tabs: secondaryTabs,
                activeIndex:
                  secondaryTabs.length === 0
                    ? -1
                    : Math.min(
                        session.editorLayout.groups.secondary.activeIndex,
                        secondaryTabs.length - 1
                      ),
                viewMode: session.editorLayout.groups.secondary.viewMode,
                isPreviewOutlineVisible:
                  session.editorLayout.groups.secondary.isPreviewOutlineVisible
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
