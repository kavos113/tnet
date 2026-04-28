import { useEffect, useState } from 'react';
import type { MarkdownSettings, LlmSettings, ProjectConfig } from '@tnet/shared/types/config';
import { defaultProjectConfig, normalizeProjectConfig } from '@tnet/shared/types/config';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { setSettings } from '@tnet/app-markdown/renderer/workspace/workspaceSlice';
import { tnetApi } from '@tnet/renderer-core/tnetApi';

export interface ProjectSettingsDraft {
  draft: ProjectConfig;
  updateMarkdownDraft: <K extends keyof MarkdownSettings>(
    key: K,
    value: MarkdownSettings[K]
  ) => void;
  updateLlmDraft: <K extends keyof LlmSettings>(key: K, value: LlmSettings[K]) => void;
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
      const merged = normalizeProjectConfig(loaded);
      dispatch(setSettings(merged));
      setDraft(merged);
    };

    loadSettings().catch((error: unknown) => {
      console.error('Failed to load settings', error);
      setDraft(defaultProjectConfig());
    });
  }, [dispatch, isOpen, rootPath]);

  const updateMarkdownDraft = <K extends keyof MarkdownSettings>(
    key: K,
    value: MarkdownSettings[K]
  ): void => {
    setDraft((current) => ({
      ...current,
      markdown: {
        ...current.markdown,
        [key]: value
      }
    }));
  };

  const updateLlmDraft = <K extends keyof LlmSettings>(key: K, value: LlmSettings[K]): void => {
    setDraft((current) => ({
      ...current,
      llm: {
        ...current.llm,
        [key]: value
      }
    }));
  };

  const saveSettings = async (): Promise<void> => {
    if (rootPath) await tnetApi.config.saveProject(rootPath, draft);
    dispatch(setSettings(draft));
  };

  return {
    draft,
    updateMarkdownDraft,
    updateLlmDraft,
    saveSettings
  };
};
