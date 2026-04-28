import { useEffect, useState } from 'react';
import { getMarkdownGlobalConfig, normalizeGlobalConfig } from '@shared/types/config';
import { useAppDispatch } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';
import { setWorkspaceRoots } from '@renderer/features/workspace/workspaceSlice';
import { useMarkdownWorkspaceSwitcher } from './useMarkdownWorkspaceSwitcher';

export const useRestoreMarkdownWorkspace = (): boolean => {
  const dispatch = useAppDispatch();
  const { switchWorkspace } = useMarkdownWorkspaceSwitcher();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restoreWorkspace = async (): Promise<void> => {
      const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
      const markdownConfig = getMarkdownGlobalConfig(config);
      const workspaceRoots = markdownConfig.workspaceRoots;
      const rootPath = markdownConfig.activeWorkspaceRoot ?? markdownConfig.lastOpenedDirectory;
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
        console.error('Failed to restore markdown workspace', error);
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
