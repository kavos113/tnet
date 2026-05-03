import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export interface MarkdownGlobalConfig {
  lastOpenedDirectory?: string;
  workspaceRoots: string[];
  activeWorkspaceRoot?: string;
  settings?: MarkdownGlobalSettings;
}

export type LlmProviderType =
  | 'mock'
  | 'openai-sdk'
  | 'gemini-sdk'
  | 'lm-studio'
  | 'openai-compatible'
  | 'local-http';

export interface MarkdownSettings {
  editorFontFamily: string;
  editorFontSize: number;
  previewFontFamily: string;
  previewFontSize: number;
  autoSaveEnabled: boolean;
  autoSaveDebounceMs: number;
}

export interface MarkdownGlobalSettings {
  editorFontFamily: string;
  editorFontSize: number;
  previewFontFamily: string;
  previewFontSize: number;
}

export interface LlmSettings {
  llmInlineCompletionEnabled: boolean;
  llmProvider: LlmProviderType;
  llmModel: string;
  llmEndpoint: string;
  llmApiKey: string;
  llmAutomaticTrigger: boolean;
  llmDebounceMs: number;
  llmRequestTimeoutMs: number;
  llmMaxPrefixChars: number;
  llmMaxSuffixChars: number;
}

export interface MarkdownProjectConfig {
  markdown: MarkdownSettings;
  llm: LlmSettings;
}

export const defaultMarkdownGlobalConfig = (): MarkdownGlobalConfig => ({
  workspaceRoots: []
});

export const defaultMarkdownGlobalSettings = (): MarkdownGlobalSettings => ({
  editorFontFamily: '',
  editorFontSize: 0,
  previewFontFamily: '',
  previewFontSize: 0
});

export const getMarkdownGlobalConfig = (config: GlobalConfig): MarkdownGlobalConfig => ({
  ...defaultMarkdownGlobalConfig(),
  ...(config.apps?.markdown as Partial<MarkdownGlobalConfig> | undefined)
});

export const getMarkdownGlobalSettings = (config: GlobalConfig): MarkdownGlobalSettings => {
  const markdownConfig = config.apps?.markdown as Partial<MarkdownGlobalConfig> | undefined;
  return {
    ...defaultMarkdownGlobalSettings(),
    ...markdownConfig?.settings
  };
};

export const withMarkdownGlobalConfig = (
  config: GlobalConfig,
  markdownConfig: MarkdownGlobalConfig
): GlobalConfig => {
  const normalizedConfig = normalizeGlobalConfig(config);

  return {
    ...normalizedConfig,
    apps: {
      ...normalizedConfig.apps,
      markdown: markdownConfig
    }
  };
};

export const withMarkdownGlobalSettings = (
  config: GlobalConfig,
  settings: MarkdownGlobalSettings
): GlobalConfig => {
  const markdownConfig = getMarkdownGlobalConfig(config);
  return withMarkdownGlobalConfig(config, {
    ...markdownConfig,
    settings
  });
};

export const defaultMarkdownSettings = (): MarkdownSettings => ({
  editorFontFamily: 'monospace',
  editorFontSize: 16,
  previewFontFamily: 'sans-serif',
  previewFontSize: 16,
  autoSaveEnabled: true,
  autoSaveDebounceMs: 1000
});

export const defaultLlmSettings = (): LlmSettings => ({
  llmInlineCompletionEnabled: true,
  llmProvider: 'mock',
  llmModel: 'mock-inline-completion',
  llmEndpoint: '',
  llmApiKey: '',
  llmAutomaticTrigger: false,
  llmDebounceMs: 600,
  llmRequestTimeoutMs: 60000,
  llmMaxPrefixChars: 6000,
  llmMaxSuffixChars: 1500
});

export const defaultMarkdownProjectConfig = (): MarkdownProjectConfig => ({
  markdown: defaultMarkdownSettings(),
  llm: defaultLlmSettings()
});

export const normalizeMarkdownProjectConfig = (
  config: Partial<MarkdownProjectConfig> = {}
): MarkdownProjectConfig => ({
  markdown: {
    ...defaultMarkdownSettings(),
    ...config.markdown
  },
  llm: {
    ...defaultLlmSettings(),
    ...config.llm
  }
});
