export interface GlobalConfig {
  lastOpenedDirectory?: string;
  workspaceRoots?: string[];
  activeWorkspaceRoot?: string;
}

export type LlmProviderType =
  | 'mock'
  | 'openai-sdk'
  | 'gemini-sdk'
  | 'lm-studio'
  | 'openai-compatible'
  | 'local-http';

export interface ProjectConfig {
  editorFontFamily: string;
  editorFontSize: number;
  previewFontFamily: string;
  previewFontSize: number;
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

export const defaultGlobalConfig = (): GlobalConfig => ({});

export const defaultProjectConfig = (): ProjectConfig => ({
  editorFontFamily: 'monospace',
  editorFontSize: 16,
  previewFontFamily: 'sans-serif',
  previewFontSize: 16,
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
