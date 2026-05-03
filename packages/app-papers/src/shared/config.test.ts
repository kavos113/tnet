import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig } from '@tnet/shared/types/config';
import {
  defaultPapersGlobalConfig,
  defaultPapersGlobalSettings,
  defaultPapersLibraryConfig,
  getPapersGlobalConfig,
  getPapersGlobalSettings,
  normalizePapersLibraryConfig,
  withPapersGlobalConfig,
  withPapersGlobalSettings
} from './config';

describe('papers config', () => {
  it('reads and writes papers global config through GlobalConfig apps slot', () => {
    const globalConfig = defaultGlobalConfig();
    expect(getPapersGlobalConfig(globalConfig)).toEqual(defaultPapersGlobalConfig());

    const nextGlobalConfig = withPapersGlobalConfig(globalConfig, {
      libraryRoots: ['/papers'],
      activeLibraryRoot: '/papers',
      lastOpenedDirectory: '/papers'
    });

    expect(getPapersGlobalConfig(nextGlobalConfig)).toEqual({
      libraryRoots: ['/papers'],
      activeLibraryRoot: '/papers',
      lastOpenedDirectory: '/papers'
    });
  });

  it('normalizes library config with defaults', () => {
    expect(
      normalizePapersLibraryConfig({
        listDensity: 'compact',
        noteEditorFontFamily: '',
        noteEditorFontSize: 0,
        notePreviewFontFamily: '',
        notePreviewFontSize: -1
      })
    ).toEqual({
      ...defaultPapersLibraryConfig(),
      listDensity: 'compact'
    });
  });

  it('keeps valid library config numeric and font values', () => {
    expect(
      normalizePapersLibraryConfig({
        pdfZoomMode: 'page-fit',
        noteEditorMode: 'editor',
        noteAutoSaveDebounceMs: 1000,
        noteEditorFontFamily: 'JetBrains Mono',
        noteEditorFontSize: 14,
        notePreviewFontFamily: 'Inter',
        notePreviewFontSize: 15
      })
    ).toEqual({
      ...defaultPapersLibraryConfig(),
      pdfZoomMode: 'page-fit',
      noteEditorMode: 'editor',
      noteAutoSaveDebounceMs: 1000,
      noteEditorFontFamily: 'JetBrains Mono',
      noteEditorFontSize: 14,
      notePreviewFontFamily: 'Inter',
      notePreviewFontSize: 15
    });
  });

  it('reads and writes global settings', () => {
    const globalConfig = defaultGlobalConfig();
    expect(getPapersGlobalSettings(globalConfig)).toEqual(defaultPapersGlobalSettings());

    const next = withPapersGlobalSettings(globalConfig, {
      ...defaultPapersGlobalSettings(),
      aiProvider: 'openai-sdk',
      aiModel: 'gpt-test',
      aiTimeoutMs: 1000
    });

    expect(getPapersGlobalSettings(next)).toMatchObject({
      aiProvider: 'openai-sdk',
      aiModel: 'gpt-test',
      aiTimeoutMs: 1000
    });
  });
});
