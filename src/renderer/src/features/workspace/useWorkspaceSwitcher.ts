import { useCallback, useEffect, useRef } from 'react';
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

  useEffect(() => {
    workspaceRootsRef.current = workspaceRoots;
  }, [workspaceRoots]);

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
              return {
                path: filePath,
                content: await tnetApi.file.read({
                  rootDir: rootPath,
                  path: toWorkspaceRelativePath(rootPath, filePath)
                })
              };
            } catch (error: unknown) {
              console.error('Failed to restore opened file', error);
              return null;
            }
          })
        )
      ).filter((file): file is { path: string; content: string } => file !== null);

      dispatch(setWorkspace({ rootPath, fileTree, workspaceRoots: nextWorkspaceRoots }));
      dispatch(setSettings(settings));
      dispatch(resetExplorerState());
      dispatch(setExpandedPaths(session.expandedFolders));
      dispatch(replaceOpenedFiles({ openedFiles, activeIndex: openedFiles.length - 1 }));

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
