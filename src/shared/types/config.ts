import { defaultAppId, type AppId } from '@shared/app/appTypes';

export interface WorkspaceAppGlobalConfig {
  lastOpenedDirectory?: string;
  workspaceRoots: string[];
  activeWorkspaceRoot?: string;
}

export type MarkdownGlobalConfig = WorkspaceAppGlobalConfig;

export interface PapersGlobalConfig {}

export interface CodeGlobalConfig {}

export interface AppGlobalConfigMap {
  markdown: MarkdownGlobalConfig;
  papers: PapersGlobalConfig;
  code: CodeGlobalConfig;
}

export interface GlobalConfig {
  activeAppId?: AppId;
  apps?: Partial<AppGlobalConfigMap>;
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

export interface LlmSettings {
  llmInlineCompletionEnabled: boolean;
  llmProvider: LlmProviderType;
  llmModel: string;
  llmEndpoint: string;
  llmApiKey: string;
  llmAutomaticTrigger: boolean;
  llmDebounceMs: number;
  llmMaxPrefixChars: number;
  llmMaxSuffixChars: number;
}

export interface ProjectConfig {
  markdown: MarkdownSettings;
  llm: LlmSettings;
}

export const defaultWorkspaceAppGlobalConfig = (): WorkspaceAppGlobalConfig => ({
  workspaceRoots: []
});

export const defaultGlobalConfig = (): GlobalConfig => ({
  activeAppId: defaultAppId,
  apps: {
    markdown: defaultWorkspaceAppGlobalConfig(),
    papers: {},
    code: {}
  }
});

export const normalizeGlobalConfig = (config: GlobalConfig): GlobalConfig => {
  const defaults = defaultGlobalConfig();

  return {
    ...defaults,
    ...config,
    apps: {
      ...defaults.apps,
      ...(config.apps ?? {})
    }
  };
};

export const getMarkdownGlobalConfig = (config: GlobalConfig): MarkdownGlobalConfig => ({
  ...defaultWorkspaceAppGlobalConfig(),
  ...(config.apps?.markdown ?? {})
});

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
  llmMaxPrefixChars: 6000,
  llmMaxSuffixChars: 1500
});

export const defaultProjectConfig = (): ProjectConfig => ({
  markdown: defaultMarkdownSettings(),
  llm: defaultLlmSettings()
});

export const normalizeProjectConfig = (config: Partial<ProjectConfig> = {}): ProjectConfig => ({
  markdown: {
    ...defaultMarkdownSettings(),
    ...(config.markdown ?? {})
  },
  llm: {
    ...defaultLlmSettings(),
    ...(config.llm ?? {})
  }
});
