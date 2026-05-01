import { useEffect, useState } from 'react';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import {
  getMarkdownGlobalConfig,
  getMarkdownGlobalSettings
} from '@tnet/app-markdown/shared/config';
import { useAppDispatch } from '@tnet/app-markdown/renderer/storeHooks';
import {
  setMarkdownGlobalSettings,
  setWorkspaceRoots
} from '@tnet/app-markdown/renderer/workspace/workspaceSlice';
import { markdownTnetApi } from '../markdownTnetApi';
import { useMarkdownWorkspaceSwitcher } from './useMarkdownWorkspaceSwitcher';

export const useRestoreMarkdownWorkspace = (): boolean => {
  const dispatch = useAppDispatch();
  const { switchWorkspace } = useMarkdownWorkspaceSwitcher();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restoreWorkspace = async (): Promise<void> => {
      const config = normalizeGlobalConfig(await markdownTnetApi.config.loadGlobal());
      const markdownConfig = getMarkdownGlobalConfig(config);
      dispatch(setMarkdownGlobalSettings(getMarkdownGlobalSettings(config)));
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
