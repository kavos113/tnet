import { useEffect, useState } from 'react';
import type { ProjectConfig } from '@shared/types/config';
import { defaultProjectConfig } from '@shared/types/config';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { setSettings } from '@renderer/features/workspace/workspaceSlice';
import { tnetApi } from '@renderer/lib/tnetApi';

export interface ProjectSettingsDraft {
  draft: ProjectConfig;
  updateDraft: <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) => void;
  saveSettings: () => Promise<void>;
}

export const useProjectSettingsDraft = (isOpen: boolean): ProjectSettingsDraft => {
  const dispatch = useAppDispatch();
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const settings = useAppSelector((state) => state.workspace.settings);
  const [draft, setDraft] = useState<ProjectConfig>(settings);

  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async (): Promise<void> => {
      const loaded = rootPath ? await tnetApi.config.loadProject(rootPath) : defaultProjectConfig();
      dispatch(setSettings(loaded));
      setDraft(loaded);
    };

    loadSettings().catch((error: unknown) => {
      console.error('Failed to load settings', error);
      setDraft(defaultProjectConfig());
    });
  }, [dispatch, isOpen, rootPath]);

  const updateDraft = <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]): void => {
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
  };

  const saveSettings = async (): Promise<void> => {
    if (rootPath) await tnetApi.config.saveProject(rootPath, draft);
    dispatch(setSettings(draft));
  };

  return {
    draft,
    updateDraft,
    saveSettings
  };
};
