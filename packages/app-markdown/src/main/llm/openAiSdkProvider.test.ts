// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { openAiSdkProvider } from './openAiSdkProvider';

const openAiConstructors = vi.hoisted(() => [] as unknown[]);
const chatCompletionsCreate = vi.hoisted(() => vi.fn());

vi.mock('openai', () => ({
  default: vi.fn(function OpenAIMock(
    this: { chat: { completions: { create: typeof chatCompletionsCreate } } },
    options: unknown
  ) {
    openAiConstructors.push(options);
    this.chat = {
      completions: {
        create: chatCompletionsCreate
      }
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
    chatCompletionsCreate.mockReset();
    chatCompletionsCreate.mockResolvedValue({
      id: 'resp_1',
      choices: [{ message: { content: ' Then $G$ has an identity element.' } }],
      model: 'gpt-5.2'
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests an inline completion through the OpenAI SDK Chat Completions API', async () => {
    const controller = new AbortController();
    const config = {
      ...defaultMarkdownProjectConfig().llm,
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
      timeout: 60000
    });
    expect(chatCompletionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.2',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Let $G$ be a group.')
          })
        ]),
        max_tokens: 128
      }),
      { signal: controller.signal }
    );
    expect(chatCompletionsCreate.mock.calls[0]?.[0]).not.toHaveProperty('reasoning');
    expect(console.log).toHaveBeenCalledWith(
      'OpenAI inline completion output:',
      ' Then $G$ has an identity element.'
    );
  });

  it('streams OpenAI SDK inline completion chunks', async () => {
    const deltas: string[] = [];
    chatCompletionsCreate.mockResolvedValue(
      (async function* () {
        yield {
          id: 'resp_stream',
          choices: [{ delta: { content: ' Then' } }],
          model: 'gpt-5.2'
        };
        yield {
          id: 'resp_stream',
          choices: [{ delta: { content: ' identity' } }],
          model: 'gpt-5.2'
        };
      })()
    );

    await expect(
      openAiSdkProvider.complete(
        request,
        {
          ...defaultMarkdownProjectConfig().llm,
          llmProvider: 'openai-sdk',
          llmModel: 'gpt-5.2',
          llmApiKey: 'test-key'
        },
        new AbortController().signal,
        { onDelta: (delta) => deltas.push(delta) }
      )
    ).resolves.toMatchObject({
      id: 'resp_stream',
      text: ' Then identity',
      provider: 'openai-sdk',
      model: 'gpt-5.2'
    });

    expect(chatCompletionsCreate.mock.calls[0]?.[0]).toMatchObject({
      stream: true
    });
    expect(chatCompletionsCreate.mock.calls[0]?.[0]).not.toHaveProperty('reasoning');
    expect(deltas).toEqual([' Then', ' identity']);
  });

  it('returns null for whitespace-only SDK output', async () => {
    chatCompletionsCreate.mockResolvedValue({
      id: 'resp_1',
      choices: [{ message: { content: '  ' } }],
      model: 'gpt-5.2'
    });

    await expect(
      openAiSdkProvider.complete(
        request,
        {
          ...defaultMarkdownProjectConfig().llm,
          llmProvider: 'openai-sdk',
          llmModel: 'gpt-5.2',
          llmApiKey: 'test-key'
        },
        new AbortController().signal
      )
    ).resolves.toBeNull();
  });
});
