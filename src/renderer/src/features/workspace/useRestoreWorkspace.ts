import { useEffect, useState } from 'react';
import { useAppDispatch } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';
import { useWorkspaceSwitcher } from './useWorkspaceSwitcher';
import { setWorkspaceRoots } from './workspaceSlice';

export const useRestoreWorkspace = (): boolean => {
  const dispatch = useAppDispatch();
  const { switchWorkspace } = useWorkspaceSwitcher();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restoreWorkspace = async (): Promise<void> => {
      const config = await tnetApi.config.loadGlobal();
      const workspaceRoots = config.workspaceRoots ?? [];
      const rootPath = config.activeWorkspaceRoot ?? config.lastOpenedDirectory;
      dispatch(setWorkspaceRoots(workspaceRoots));
      if (!rootPath) return;
      if (canceled) return;

      await switchWorkspace(rootPath, {
        workspaceRoots,
        persistGlobalConfig: false
      });
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
  }, [dispatch, switchWorkspace]);

  return isRestoring;
};
