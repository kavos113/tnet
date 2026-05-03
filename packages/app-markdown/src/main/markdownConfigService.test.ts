// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { loadMarkdownProjectConfig, saveMarkdownProjectConfig } from './markdownConfigService';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-${name}-`));
};

describe('markdown config service', () => {
  it('returns default markdown project config when settings do not exist', async () => {
    const root = await tempDir('markdown-project-config-default');

    await expect(loadMarkdownProjectConfig(root)).resolves.toEqual(defaultMarkdownProjectConfig());
  });

  it('saves and loads markdown project config', async () => {
    const root = await tempDir('markdown-project-config-save');
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
        llmRequestTimeoutMs: 45000,
        llmMaxPrefixChars: 4000,
        llmMaxSuffixChars: 1000
      }
    };

    await saveMarkdownProjectConfig(root, config);

    await expect(loadMarkdownProjectConfig(root)).resolves.toEqual(config);
  });

  it('merges missing markdown project config keys with defaults', async () => {
    const root = await tempDir('markdown-project-config-merge');

    await saveMarkdownProjectConfig(root, {
      markdown: {
        ...defaultMarkdownProjectConfig().markdown,
        editorFontFamily: 'Consolas',
        editorFontSize: 14,
        previewFontFamily: 'Georgia',
        previewFontSize: 18
      },
      llm: defaultMarkdownProjectConfig().llm
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

    await expect(loadMarkdownProjectConfig(root)).resolves.toMatchObject({
      markdown: {
        editorFontFamily: 'Project Font',
        previewFontFamily: 'sans-serif'
      },
      llm: {
        llmProvider: 'mock',
        llmDebounceMs: 600,
        llmRequestTimeoutMs: 60000
      }
    });
  });
});
