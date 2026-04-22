import { useEffect, useState } from 'react';
import { toWorkspaceRelativePath } from '@shared/path/pathUtils';
import { useAppDispatch } from '@renderer/app/hooks';
import { openFile } from '@renderer/features/editor/editorSlice';
import { setExpandedPaths } from '@renderer/features/explorer/explorerSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { setSettings, setWorkspace } from './workspaceSlice';

export const useRestoreWorkspace = (): boolean => {
  const dispatch = useAppDispatch();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restoreWorkspace = async (): Promise<void> => {
      const config = await tnetApi.config.loadGlobal();
      if (!config.lastOpenedDirectory) return;

      const rootPath = config.lastOpenedDirectory;
      const fileTree = await tnetApi.workspace.getFileTree(rootPath);
      if (canceled) return;

      dispatch(setWorkspace({ rootPath, fileTree }));
      dispatch(setSettings(await tnetApi.config.loadProject(rootPath)));

      const session = await tnetApi.session.load(rootPath);
      if (canceled) return;

      dispatch(setExpandedPaths(session.expandedFolders));
      for (const filePath of session.openedFiles) {
        try {
          const content = await tnetApi.file.read({
            rootDir: rootPath,
            path: toWorkspaceRelativePath(rootPath, filePath)
          });
          if (!canceled) dispatch(openFile({ path: filePath, content }));
        } catch (error: unknown) {
          console.warn('Failed to restore file', filePath, error);
        }
      }
    };

    restoreWorkspace()
      .catch((error: unknown) => {
        console.error('Failed to restore workspace', error);
      })
      .finally(() => {
        if (!canceled) setIsRestoring(false);
      });

    return () => {
      canceled = true;
    };
  }, [dispatch]);

  return isRestoring;
};
