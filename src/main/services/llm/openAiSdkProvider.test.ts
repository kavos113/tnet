// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@shared/llm/inlineCompletionTypes';
import { defaultProjectConfig } from '@shared/types/config';
import { openAiSdkProvider } from './openAiSdkProvider';

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

describe('openAiSdkProvider', () => {
  beforeEach(() => {
    openAiConstructors.length = 0;
    responsesCreate.mockReset();
    responsesCreate.mockResolvedValue({
      id: 'resp_1',
      output_text: ' Then $G$ has an identity element.',
      model: 'gpt-5.2'
    });
  });

  it('requests an inline completion through the OpenAI SDK Responses API', async () => {
    const controller = new AbortController();
    const config = {
      ...defaultProjectConfig().llm,
      llmProvider: 'openai-sdk' as const,
      llmModel: 'gpt-5.2',
      llmEndpoint: 'https://example.test/v1',
      llmApiKey: 'test-key'
    };

    await expect(openAiSdkProvider.complete(request, config, controller.signal)).resolves.toEqual({
      id: 'resp_1',
      text: ' Then $G$ has an identity element.',
      provider: 'openai-sdk',
      model: 'gpt-5.2'
    });

    expect(openAiConstructors[0]).toMatchObject({
      apiKey: 'test-key',
      baseURL: 'https://example.test/v1',
      maxRetries: 0,
      timeout: 15000
    });
    expect(responsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.2',
        input: expect.stringContaining('Let $G$ be a group.'),
        max_output_tokens: 128
      }),
      { signal: controller.signal }
    );
  });

  it('returns null for whitespace-only SDK output', async () => {
    responsesCreate.mockResolvedValue({
      id: 'resp_1',
      output_text: '  ',
      model: 'gpt-5.2'
    });

    await expect(
      openAiSdkProvider.complete(
        request,
        {
          ...defaultProjectConfig().llm,
          llmProvider: 'openai-sdk',
          llmModel: 'gpt-5.2',
          llmApiKey: 'test-key'
        },
        new AbortController().signal
      )
    ).resolves.toBeNull();
  });
});
