// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@shared/llm/inlineCompletionTypes';
import { defaultProjectConfig } from '@shared/types/config';
import { lmStudioProvider } from './lmStudioProvider';

const openAiConstructors = vi.hoisted(() => [] as unknown[]);
const responsesCreate = vi.hoisted(() => vi.fn());

vi.mock('openai', () => ({
  default: vi.fn(function OpenAIMock(
    this: { responses: { create: typeof responsesCreate } },
    options: unknown
  ) {
    openAiConstructors.push(options);
    this.responses = {
      create: responsesCreate
    };
  })
}));

const request: InlineCompletionRequest = {
  workspaceRoot: '/workspace',
  filePath: 'note.md',
  language: 'markdown',
  prefix: 'Let $G$ be a group.',
  suffix: '',
  selectedText: '',
  cursorOffset: 19,
  trigger: 'manual'
};

describe('lmStudioProvider', () => {
  beforeEach(() => {
    openAiConstructors.length = 0;
    responsesCreate.mockReset();
    responsesCreate.mockResolvedValue({
      id: 'lmstudio-response-1',
      output_text: ' Then $G$ has an identity element.',
      model: 'local-model'
    });
  });

  it('requests an inline completion through an LM Studio OpenAI-compatible endpoint', async () => {
    const controller = new AbortController();
    const config = {
      ...defaultProjectConfig().llm,
      llmProvider: 'lm-studio' as const,
      llmModel: 'local-model',
      llmEndpoint: 'http://localhost:1234/v1',
      llmApiKey: ''
    };

    await expect(lmStudioProvider.complete(request, config, controller.signal)).resolves.toEqual({
      id: 'lmstudio-response-1',
      text: ' Then $G$ has an identity element.',
      provider: 'lm-studio',
      model: 'local-model'
    });

    expect(openAiConstructors[0]).toMatchObject({
      apiKey: 'lm-studio',
      baseURL: 'http://localhost:1234/v1',
      maxRetries: 0,
      timeout: 15000
    });
    expect(responsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'local-model',
        input: expect.stringContaining('Let $G$ be a group.'),
        max_output_tokens: 128
      }),
      { signal: controller.signal }
    );
  });

  it('uses the default LM Studio base URL when endpoint is empty', async () => {
    await lmStudioProvider.complete(
      request,
      {
        ...defaultProjectConfig().llm,
        llmProvider: 'lm-studio',
        llmModel: 'local-model'
      },
      new AbortController().signal
    );

    expect(openAiConstructors[0]).toMatchObject({
      baseURL: 'http://localhost:1234/v1'
    });
  });
});
