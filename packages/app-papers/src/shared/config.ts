import type { GlobalConfig } from '@tnet/shared/types/config';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';

export interface PapersGlobalConfig {
  libraryRoots: string[];
  activeLibraryRoot?: string;
  lastOpenedDirectory?: string;
}

export type PapersListDensity = 'comfortable' | 'compact';
export type PapersPdfZoomMode = 'page-width' | 'page-fit' | 'actual-size';
export type PapersNoteEditorMode = 'editor' | 'preview' | 'split';

export interface PapersLibraryConfig {
  listDensity: PapersListDensity;
  pdfZoomMode: PapersPdfZoomMode;
  noteEditorMode: PapersNoteEditorMode;
  noteAutoSaveDebounceMs: number;
}

export const defaultPapersGlobalConfig = (): PapersGlobalConfig => ({
  libraryRoots: []
});

export const defaultPapersLibraryConfig = (): PapersLibraryConfig => ({
  listDensity: 'comfortable',
  pdfZoomMode: 'page-width',
  noteEditorMode: 'split',
  noteAutoSaveDebounceMs: 500
});

export const getPapersGlobalConfig = (config: GlobalConfig): PapersGlobalConfig => ({
  ...defaultPapersGlobalConfig(),
  ...((config.apps?.papers as Partial<PapersGlobalConfig> | undefined) ?? {})
});

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

export const normalizePapersLibraryConfig = (
  config: Partial<PapersLibraryConfig> = {}
): PapersLibraryConfig => ({
  ...defaultPapersLibraryConfig(),
  ...config,
  noteAutoSaveDebounceMs:
    config.noteAutoSaveDebounceMs && config.noteAutoSaveDebounceMs > 0
      ? config.noteAutoSaveDebounceMs
      : defaultPapersLibraryConfig().noteAutoSaveDebounceMs
});
