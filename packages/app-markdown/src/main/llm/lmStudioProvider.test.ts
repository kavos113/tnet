// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { lmStudioProvider } from './lmStudioProvider';

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

describe('lmStudioProvider', () => {
  beforeEach(() => {
    openAiConstructors.length = 0;
    chatCompletionsCreate.mockReset();
    chatCompletionsCreate.mockResolvedValue({
      id: 'lmstudio-response-1',
      choices: [{ message: { content: ' Then $G$ has an identity element.' } }],
      model: 'local-model'
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests an inline completion through an LM Studio OpenAI-compatible endpoint', async () => {
    const controller = new AbortController();
    const config = {
      ...defaultMarkdownProjectConfig().llm,
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
      timeout: 60000
    });
    expect(chatCompletionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'local-model',
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
      'LM Studio inline completion output:',
      ' Then $G$ has an identity element.'
    );
  });

  it('uses the default LM Studio base URL when endpoint is empty', async () => {
    await lmStudioProvider.complete(
      request,
      {
        ...defaultMarkdownProjectConfig().llm,
        llmProvider: 'lm-studio',
        llmModel: 'local-model'
      },
      new AbortController().signal
    );

    expect(openAiConstructors[0]).toMatchObject({
      baseURL: 'http://localhost:1234/v1'
    });
  });

  it('streams LM Studio inline completion chunks', async () => {
    const deltas: string[] = [];
    chatCompletionsCreate.mockResolvedValue(
      (async function* () {
        yield {
          id: 'lmstudio-stream',
          choices: [{ delta: { content: ' local' } }],
          model: 'local-model'
        };
        yield {
          id: 'lmstudio-stream',
          choices: [{ delta: { content: ' text' } }],
          model: 'local-model'
        };
      })()
    );

    await expect(
      lmStudioProvider.complete(
        request,
        {
          ...defaultMarkdownProjectConfig().llm,
          llmProvider: 'lm-studio',
          llmModel: 'local-model'
        },
        new AbortController().signal,
        { onDelta: (delta) => deltas.push(delta) }
      )
    ).resolves.toMatchObject({
      id: 'lmstudio-stream',
      text: ' local text',
      provider: 'lm-studio',
      model: 'local-model'
    });

    expect(chatCompletionsCreate.mock.calls[0]?.[0]).toMatchObject({
      stream: true
    });
    expect(chatCompletionsCreate.mock.calls[0]?.[0]).not.toHaveProperty('reasoning');
    expect(deltas).toEqual([' local', ' text']);
  });
});
