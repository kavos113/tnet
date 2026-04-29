// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig, type GlobalConfig } from '@tnet/shared/types/config';
import {
  loadPapersGlobalConfig,
  loadPapersLibraryConfig,
  savePapersGlobalConfig,
  savePapersLibraryConfig,
  type PapersGlobalConfigStore
} from './papersConfigService';

const tempDir = async (): Promise<string> => fs.mkdtemp(path.join(os.tmpdir(), 'tnet-papers-'));

const createMemoryGlobalConfigStore = (): PapersGlobalConfigStore & {
  read: () => GlobalConfig;
} => {
  let config = defaultGlobalConfig();
  return {
    loadGlobalConfig: async () => config,
    saveGlobalConfig: async (nextConfig) => {
      config = nextConfig;
    },
    read: () => config
  };
};

describe('papersConfigService', () => {
  it('persists papers global config inside the app config slot', async () => {
    const store = createMemoryGlobalConfigStore();

    await savePapersGlobalConfig(store, {
      libraryRoots: ['/library'],
      activeLibraryRoot: '/library'
    });

    await expect(loadPapersGlobalConfig(store)).resolves.toEqual({
      libraryRoots: ['/library'],
      activeLibraryRoot: '/library'
    });
    expect(store.read().apps?.papers).toEqual({
      libraryRoots: ['/library'],
      activeLibraryRoot: '/library'
    });
  });

  it('saves and loads library-local settings', async () => {
    const root = await tempDir();

    await expect(loadPapersLibraryConfig(root)).resolves.toEqual({
      listDensity: 'comfortable',
      pdfZoomMode: 'page-width',
      noteEditorMode: 'split'
    });

    await savePapersLibraryConfig(root, {
      listDensity: 'compact',
      pdfZoomMode: 'actual-size',
      noteEditorMode: 'editor'
    });

    await expect(loadPapersLibraryConfig(root)).resolves.toEqual({
      listDensity: 'compact',
      pdfZoomMode: 'actual-size',
      noteEditorMode: 'editor'
    });
  });
});
