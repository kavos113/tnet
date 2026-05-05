// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InlineCompletionRequest } from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { geminiSdkProvider } from './geminiSdkProvider';

const geminiConstructors = vi.hoisted(() => [] as unknown[]);
const generateContent = vi.hoisted(() => vi.fn());
const generateContentStream = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function GoogleGenAIMock(
    this: {
      models: {
        generateContent: typeof generateContent;
        generateContentStream: typeof generateContentStream;
      };
    },
    options: unknown
  ) {
    geminiConstructors.push(options);
    this.models = {
      generateContent,
      generateContentStream
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

describe('geminiSdkProvider', () => {
  beforeEach(() => {
    geminiConstructors.length = 0;
    generateContent.mockReset();
    generateContentStream.mockReset();
    generateContent.mockResolvedValue({
      responseId: 'gemini-response-1',
      text: ' Then $G$ has an identity element.',
      modelVersion: 'gemini-2.5-flash'
    });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests an inline completion through the Gemini SDK', async () => {
    const controller = new AbortController();
    const config = {
      ...defaultMarkdownProjectConfig().llm,
      llmProvider: 'gemini-sdk' as const,
      llmModel: 'gemini-2.5-flash',
      llmEndpoint: 'https://example.test',
      llmApiKey: 'gemini-key'
    };

    await expect(geminiSdkProvider.complete(request, config, controller.signal)).resolves.toEqual({
      id: 'gemini-response-1',
      text: ' Then $G$ has an identity element.',
      provider: 'gemini-sdk',
      model: 'gemini-2.5-flash'
    });

    expect(geminiConstructors[0]).toMatchObject({
      apiKey: 'gemini-key',
      httpOptions: {
        baseUrl: 'https://example.test',
        timeout: 60000
      }
    });
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Let $G$ be a group.'),
        config: expect.objectContaining({
          maxOutputTokens: 128,
          abortSignal: controller.signal
        })
      })
    );
    expect(console.log).toHaveBeenCalledWith(
      'Gemini inline completion output:',
      ' Then $G$ has an identity element.'
    );
  });

  it('returns null for whitespace-only SDK output', async () => {
    generateContent.mockResolvedValue({
      responseId: 'gemini-response-1',
      text: '  ',
      modelVersion: 'gemini-2.5-flash'
    });

    await expect(
      geminiSdkProvider.complete(
        request,
        {
          ...defaultMarkdownProjectConfig().llm,
          llmProvider: 'gemini-sdk',
          llmModel: 'gemini-2.5-flash',
          llmApiKey: 'gemini-key'
        },
        new AbortController().signal
      )
    ).resolves.toBeNull();
  });

  it('streams Gemini inline completion chunks', async () => {
    const deltas: string[] = [];
    generateContentStream.mockResolvedValue(
      (async function* () {
        yield {
          responseId: 'gemini-stream',
          text: ' Then',
          modelVersion: 'gemini-2.5-flash'
        };
        yield {
          responseId: 'gemini-stream',
          text: ' identity',
          modelVersion: 'gemini-2.5-flash'
        };
      })()
    );

    await expect(
      geminiSdkProvider.complete(
        request,
        {
          ...defaultMarkdownProjectConfig().llm,
          llmProvider: 'gemini-sdk',
          llmModel: 'gemini-2.5-flash',
          llmApiKey: 'gemini-key'
        },
        new AbortController().signal,
        { onDelta: (delta) => deltas.push(delta) }
      )
    ).resolves.toMatchObject({
      id: 'gemini-stream',
      text: ' Then identity',
      provider: 'gemini-sdk',
      model: 'gemini-2.5-flash'
    });

    expect(generateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Let $G$ be a group.')
      })
    );
    expect(deltas).toEqual([' Then', ' identity']);
  });
});
