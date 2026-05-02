import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export interface PapersGlobalConfig {
  libraryRoots: string[];
  activeLibraryRoot?: string;
  lastOpenedDirectory?: string;
  settings?: PapersGlobalSettings;
}

export type PapersListDensity = 'comfortable' | 'compact';
export type PapersPdfZoomMode = 'page-width' | 'page-fit' | 'actual-size';
export type PapersNoteEditorMode = 'editor' | 'preview' | 'split';

export interface PapersLibraryConfig {
  listDensity: PapersListDensity;
  pdfZoomMode: PapersPdfZoomMode;
  noteEditorMode: PapersNoteEditorMode;
  noteAutoSaveDebounceMs: number;
  noteEditorFontFamily: string;
  noteEditorFontSize: number;
  notePreviewFontFamily: string;
  notePreviewFontSize: number;
}

export interface PapersGlobalSettings {
  noteEditorFontFamily: string;
  noteEditorFontSize: number;
  notePreviewFontFamily: string;
  notePreviewFontSize: number;
  aiProvider: 'mock' | 'openai-sdk' | 'gemini-sdk';
  aiModel: string;
  aiEndpoint: string;
  aiApiKey: string;
  aiTimeoutMs: number;
  aiDefaultTargetLanguage: string;
  aiTextChunkChars: number;
  aiMaxOutputTokens: number;
}

export const defaultPapersGlobalConfig = (): PapersGlobalConfig => ({
  libraryRoots: []
});

export const defaultPapersGlobalSettings = (): PapersGlobalSettings => ({
  noteEditorFontFamily: '',
  noteEditorFontSize: 0,
  notePreviewFontFamily: '',
  notePreviewFontSize: 0,
  aiProvider: 'mock',
  aiModel: 'mock-paper-ai',
  aiEndpoint: '',
  aiApiKey: '',
  aiTimeoutMs: 60000,
  aiDefaultTargetLanguage: 'Japanese',
  aiTextChunkChars: 12000,
  aiMaxOutputTokens: 4096
});

export const defaultPapersLibraryConfig = (): PapersLibraryConfig => ({
  listDensity: 'comfortable',
  pdfZoomMode: 'page-width',
  noteEditorMode: 'split',
  noteAutoSaveDebounceMs: 500,
  noteEditorFontFamily: 'monospace',
  noteEditorFontSize: 16,
  notePreviewFontFamily: 'sans-serif',
  notePreviewFontSize: 16
});

export const getPapersGlobalConfig = (config: GlobalConfig): PapersGlobalConfig => ({
  ...defaultPapersGlobalConfig(),
  ...(config.apps?.papers as Partial<PapersGlobalConfig> | undefined)
});

export const getPapersGlobalSettings = (config: GlobalConfig): PapersGlobalSettings => {
  const papersConfig = config.apps?.papers as Partial<PapersGlobalConfig> | undefined;
  return {
    ...defaultPapersGlobalSettings(),
    ...papersConfig?.settings
  };
};

export const withPapersGlobalConfig = (
  config: GlobalConfig,
  papersConfig: PapersGlobalConfig
): GlobalConfig => {
  const normalizedConfig = normalizeGlobalConfig(config);

  return {
    ...normalizedConfig,
    apps: {
      ...normalizedConfig.apps,
      papers: papersConfig
    }
  };
};

export const withPapersGlobalSettings = (
  config: GlobalConfig,
  settings: PapersGlobalSettings
): GlobalConfig => {
  const papersConfig = getPapersGlobalConfig(config);
  return withPapersGlobalConfig(config, {
    ...papersConfig,
    settings
  });
};

export const normalizePapersLibraryConfig = (
  config: Partial<PapersLibraryConfig> = {}
): PapersLibraryConfig => {
  const defaults = defaultPapersLibraryConfig();
  return {
    ...defaults,
    ...config,
    noteAutoSaveDebounceMs:
      config.noteAutoSaveDebounceMs && config.noteAutoSaveDebounceMs > 0
        ? config.noteAutoSaveDebounceMs
        : defaults.noteAutoSaveDebounceMs,
    noteEditorFontFamily: config.noteEditorFontFamily || defaults.noteEditorFontFamily,
    noteEditorFontSize:
      config.noteEditorFontSize && config.noteEditorFontSize > 0
        ? config.noteEditorFontSize
        : defaults.noteEditorFontSize,
    notePreviewFontFamily: config.notePreviewFontFamily || defaults.notePreviewFontFamily,
    notePreviewFontSize:
      config.notePreviewFontSize && config.notePreviewFontSize > 0
        ? config.notePreviewFontSize
        : defaults.notePreviewFontSize
  };
};
