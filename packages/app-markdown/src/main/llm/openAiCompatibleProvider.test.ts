// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { openAiCompatibleProvider } from './openAiCompatibleProvider';

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

describe('openAiCompatibleProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('streams OpenAI-compatible SSE chunks', async () => {
    const deltas: string[] = [];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: streamFromText(
        [
          'data: {"id":"chatcmpl-1","model":"local-model","choices":[{"delta":{"content":" Then"}}]}\n\n',
          'data: {"id":"chatcmpl-1","model":"local-model","choices":[{"delta":{"content":" identity"}}]}\n\n',
          'data: [DONE]\n\n'
        ].join('')
      )
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(
      openAiCompatibleProvider.complete(
        request,
        {
          ...defaultMarkdownProjectConfig().llm,
          llmProvider: 'openai-compatible',
          llmModel: 'local-model',
          llmEndpoint: 'http://localhost:8080/v1/chat/completions'
        },
        new AbortController().signal,
        { onDelta: (delta) => deltas.push(delta) }
      )
    ).resolves.toMatchObject({
      id: 'chatcmpl-1',
      text: ' Then identity',
      provider: 'openai-compatible',
      model: 'local-model'
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'local-model',
      stream: true,
      max_tokens: 128
    });
    expect(JSON.parse(String(init.body))).not.toHaveProperty('reasoning');
    expect(deltas).toEqual([' Then', ' identity']);
  });
});

const streamFromText = (text: string): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    }
  });
