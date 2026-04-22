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

    await saveGlobalConfig(userDataDir, {
      lastOpenedDirectory: 'C:/workspace',
      activeWorkspaceRoot: 'C:/workspace',
      workspaceRoots: ['C:/workspace', 'D:/notes']
    });

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual({
      lastOpenedDirectory: 'C:/workspace',
      activeWorkspaceRoot: 'C:/workspace',
      workspaceRoots: ['C:/workspace', 'D:/notes']
    });
  });

  it('returns default project config when settings do not exist', async () => {
    const root = await tempDir('project-config-default');

    await expect(loadProjectConfig(root)).resolves.toEqual({
      editorFontFamily: 'monospace',
      editorFontSize: 16,
      previewFontFamily: 'sans-serif',
      previewFontSize: 16,
      autoSaveEnabled: true,
      autoSaveDebounceMs: 1000,
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
  });

  it('saves and loads project config', async () => {
    const root = await tempDir('project-config-save');
    const config = {
      editorFontFamily: 'Consolas',
      editorFontSize: 14,
      previewFontFamily: 'Georgia',
      previewFontSize: 18,
      autoSaveEnabled: true,
      autoSaveDebounceMs: 750,
      llmInlineCompletionEnabled: true,
      llmProvider: 'local-http' as const,
      llmModel: 'local-model',
      llmEndpoint: 'http://localhost:11434/inline',
      llmApiKey: '',
      llmAutomaticTrigger: true,
      llmDebounceMs: 400,
      llmMaxPrefixChars: 4000,
      llmMaxSuffixChars: 1000
    };

    await saveProjectConfig(root, config);

    await expect(loadProjectConfig(root)).resolves.toEqual(config);
  });

  it('merges missing project config keys with defaults', async () => {
    const root = await tempDir('project-config-merge');

    await saveProjectConfig(root, {
      editorFontFamily: 'Consolas',
      editorFontSize: 14,
      previewFontFamily: 'Georgia',
      previewFontSize: 18,
      autoSaveEnabled: true,
      autoSaveDebounceMs: 1000,
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

    await fs.writeFile(
      path.join(root, '.tnet', 'settings.json'),
      JSON.stringify({
        editorFontFamily: 'Legacy Font',
        editorFontSize: 13,
        previewFontFamily: 'Legacy Preview',
        previewFontSize: 15
      }),
      'utf-8'
    );

    await expect(loadProjectConfig(root)).resolves.toMatchObject({
      editorFontFamily: 'Legacy Font',
      llmProvider: 'mock',
      llmDebounceMs: 600
    });
  });
});
