// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadGlobalConfig, saveGlobalConfig } from '../configService';
import { loadProjectConfig, saveProjectConfig } from '../projectConfigService';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-${name}-`));
};

describe('config services', () => {
  it('returns default global config when the file does not exist', async () => {
    const userDataDir = await tempDir('global-config');

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual({});
  });

  it('saves and loads global config', async () => {
    const userDataDir = await tempDir('global-config-save');

    await saveGlobalConfig(userDataDir, { lastOpenedDirectory: 'C:/workspace' });

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual({
      lastOpenedDirectory: 'C:/workspace'
    });
  });

  it('returns default project config when settings do not exist', async () => {
    const root = await tempDir('project-config-default');

    await expect(loadProjectConfig(root)).resolves.toEqual({
      editorFontFamily: 'monospace',
      editorFontSize: 16,
      previewFontFamily: 'sans-serif',
      previewFontSize: 16
    });
  });

  it('saves and loads project config', async () => {
    const root = await tempDir('project-config-save');
    const config = {
      editorFontFamily: 'Consolas',
      editorFontSize: 14,
      previewFontFamily: 'Georgia',
      previewFontSize: 18
    };

    await saveProjectConfig(root, config);

    await expect(loadProjectConfig(root)).resolves.toEqual(config);
  });
});
