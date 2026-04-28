// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig, defaultProjectConfig } from '@tnet/shared/types/config';
import { loadGlobalConfig, saveGlobalConfig } from '../configService';
import { loadProjectConfig, saveProjectConfig } from '../projectConfigService';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-${name}-`));
};

describe('config services', () => {
  it('returns default global config when the file does not exist', async () => {
    const userDataDir = await tempDir('global-config');

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual(defaultGlobalConfig());
  });

  it('saves and loads global config', async () => {
    const userDataDir = await tempDir('global-config-save');

    await saveGlobalConfig(userDataDir, {
      activeAppId: 'markdown',
      apps: {
        markdown: {
          lastOpenedDirectory: 'C:/workspace',
          activeWorkspaceRoot: 'C:/workspace',
          workspaceRoots: ['C:/workspace', 'D:/notes']
        }
      }
    });

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual({
      activeAppId: 'markdown',
      apps: {
        markdown: {
          lastOpenedDirectory: 'C:/workspace',
          activeWorkspaceRoot: 'C:/workspace',
          workspaceRoots: ['C:/workspace', 'D:/notes']
        },
        papers: {},
        code: {}
      }
    });
  });

  it('returns default project config when settings do not exist', async () => {
    const root = await tempDir('project-config-default');

    await expect(loadProjectConfig(root)).resolves.toEqual(defaultProjectConfig());
  });

  it('saves and loads project config', async () => {
    const root = await tempDir('project-config-save');
    const config = {
      markdown: {
        editorFontFamily: 'Consolas',
        editorFontSize: 14,
        previewFontFamily: 'Georgia',
        previewFontSize: 18,
        autoSaveEnabled: true,
        autoSaveDebounceMs: 750
      },
      llm: {
        llmInlineCompletionEnabled: true,
        llmProvider: 'local-http' as const,
        llmModel: 'local-model',
        llmEndpoint: 'http://localhost:11434/inline',
        llmApiKey: '',
        llmAutomaticTrigger: true,
        llmDebounceMs: 400,
        llmMaxPrefixChars: 4000,
        llmMaxSuffixChars: 1000
      }
    };

    await saveProjectConfig(root, config);

    await expect(loadProjectConfig(root)).resolves.toEqual(config);
  });

  it('merges missing project config keys with defaults', async () => {
    const root = await tempDir('project-config-merge');

    await saveProjectConfig(root, {
      markdown: {
        ...defaultProjectConfig().markdown,
        editorFontFamily: 'Consolas',
        editorFontSize: 14,
        previewFontFamily: 'Georgia',
        previewFontSize: 18
      },
      llm: defaultProjectConfig().llm
    });

    await fs.writeFile(
      path.join(root, '.tnet', 'settings.json'),
      JSON.stringify({
        markdown: {
          editorFontFamily: 'Project Font',
          editorFontSize: 13
        }
      }),
      'utf-8'
    );

    await expect(loadProjectConfig(root)).resolves.toMatchObject({
      markdown: {
        editorFontFamily: 'Project Font',
        previewFontFamily: 'sans-serif'
      },
      llm: {
        llmProvider: 'mock',
        llmDebounceMs: 600
      }
    });
  });
});
