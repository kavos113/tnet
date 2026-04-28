import { useEffect, useState } from 'react';
import type {
  LlmSettings,
  MarkdownProjectConfig,
  MarkdownSettings
} from '@tnet/app-markdown/shared/config';
import {
  defaultMarkdownProjectConfig,
  normalizeMarkdownProjectConfig
} from '@tnet/app-markdown/shared/config';
import { setSettings } from '../workspace/workspaceSlice';
import { markdownTnetApi } from '../markdownTnetApi';
import { useAppDispatch, useAppSelector } from '../storeHooks';

export interface ProjectSettingsDraft {
  draft: MarkdownProjectConfig;
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
  const [draft, setDraft] = useState<MarkdownProjectConfig>(settings);

  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async (): Promise<void> => {
      const loaded = rootPath
        ? await markdownTnetApi.markdown.config.loadProject(rootPath)
        : defaultMarkdownProjectConfig();
      const merged = normalizeMarkdownProjectConfig(loaded);
      dispatch(setSettings(merged));
      setDraft(merged);
    };

    loadSettings().catch((error: unknown) => {
      console.error('Failed to load settings', error);
      setDraft(defaultMarkdownProjectConfig());
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
    if (rootPath) await markdownTnetApi.markdown.config.saveProject(rootPath, draft);
    dispatch(setSettings(draft));
  };

  return {
    draft,
    updateMarkdownDraft,
    updateLlmDraft,
    saveSettings
  };
};
