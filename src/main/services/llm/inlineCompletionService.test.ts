// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@shared/llm/inlineCompletionTypes';
import { defaultProjectConfig, type ProjectConfig } from '@shared/types/config';
import { saveProjectConfig } from '../projectConfigService';
import { getInlineCompletion } from './inlineCompletionService';

const createRequest = (
  overrides: Partial<InlineCompletionRequest> = {}
): InlineCompletionRequest => ({
  workspaceRoot: '',
  filePath: 'note.md',
  language: 'markdown',
  cursorOffset: 5,
  prefix: 'Hello',
  suffix: '',
  selectedText: '',
  trigger: 'manual',
  ...overrides
});

describe('getInlineCompletion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createWorkspace = async (config: Partial<ProjectConfig> = {}): Promise<string> => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-llm-'));
    await saveProjectConfig(root, {
      ...defaultProjectConfig(),
      ...config,
      markdown: {
        ...defaultProjectConfig().markdown,
        ...(config.markdown ?? {})
      },
      llm: {
        ...defaultProjectConfig().llm,
        ...(config.llm ?? {})
      }
    });
    return root;
  };

  it('returns the mock inline completion for manual requests', async () => {
    const workspaceRoot = await createWorkspace();

    await expect(getInlineCompletion(createRequest({ workspaceRoot }))).resolves.toMatchObject({
      text: ' completed by inline LLM',
      provider: 'mock',
      model: 'mock-inline-completion'
    });
  });

  it('does not return noisy mock suggestions for automatic requests', async () => {
    const workspaceRoot = await createWorkspace();

    await expect(
      getInlineCompletion(createRequest({ workspaceRoot, trigger: 'automatic' }))
    ).resolves.toBeNull();
  });

  it('returns null when inline completion is disabled', async () => {
    const workspaceRoot = await createWorkspace({
      llm: {
        ...defaultProjectConfig().llm,
        llmInlineCompletionEnabled: false
      }
    });

    await expect(getInlineCompletion(createRequest({ workspaceRoot }))).resolves.toBeNull();
  });

  it('uses the local HTTP provider configured in project settings', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'local-1',
        text: ' from local model',
        model: 'local-model'
      })
    });
    vi.stubGlobal('fetch', fetchMock);
    const workspaceRoot = await createWorkspace({
      llm: {
        ...defaultProjectConfig().llm,
        llmProvider: 'local-http',
        llmModel: 'local-model',
        llmEndpoint: 'http://localhost:11434/inline'
      }
    });

    await expect(getInlineCompletion(createRequest({ workspaceRoot }))).resolves.toMatchObject({
      id: 'local-1',
      text: ' from local model',
      provider: 'local-http',
      model: 'local-model'
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/inline',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
