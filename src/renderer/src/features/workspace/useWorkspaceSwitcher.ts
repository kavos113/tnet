import { useCallback, useEffect, useRef } from 'react';
import { textByteLength } from '@shared/file/largeFile';
import { toWorkspaceRelativePath } from '@shared/path/pathUtils';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { replaceOpenedFiles } from '@renderer/features/editor/editorSlice';
import { resetExplorerState, setExpandedPaths } from '@renderer/features/explorer/explorerSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { setSettings, setWorkspace } from './workspaceSlice';

interface SwitchWorkspaceOptions {
  workspaceRoots?: string[];
  persistGlobalConfig?: boolean;
}

export const useWorkspaceSwitcher = (): {
  switchWorkspace: (rootPath: string, options?: SwitchWorkspaceOptions) => Promise<void>;
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
    async (rootPath: string, options: SwitchWorkspaceOptions = {}): Promise<void> => {
      if (!rootPath) return;

      const nextWorkspaceRoots = Array.from(
        new Set([...(options.workspaceRoots ?? workspaceRootsRef.current), rootPath])
      );
      const [fileTree, settings, session] = await Promise.all([
        tnetApi.workspace.getFileTree(rootPath),
        tnetApi.config.loadProject(rootPath),
        tnetApi.session.load(rootPath)
      ]);
      const openedFiles = (
        await Promise.all(
          session.openedFiles.map(async (filePath) => {
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
              console.error('Failed to restore opened file', error);
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
      dispatch(replaceOpenedFiles({ openedFiles, activeIndex: openedFiles.length - 1 }));
      if (searchRebuildTimerRef.current !== null) {
        window.clearTimeout(searchRebuildTimerRef.current);
      }
      searchRebuildRootRef.current = rootPath;
      searchRebuildTimerRef.current = window.setTimeout(() => {
        if (searchRebuildRootRef.current !== rootPath) return;
        tnetApi.search.rebuild(rootPath).catch((error: unknown) => {
          console.error('Failed to rebuild search index', error);
        });
      }, 500);

      if (options.persistGlobalConfig !== false) {
        await tnetApi.config.saveGlobal({
          lastOpenedDirectory: rootPath,
          activeWorkspaceRoot: rootPath,
          workspaceRoots: nextWorkspaceRoots
        });
      }
    },
    [dispatch]
  );

  return { switchWorkspace };
};
