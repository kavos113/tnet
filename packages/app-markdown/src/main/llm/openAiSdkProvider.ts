import OpenAI from 'openai';
import { buildInlineCompletionPrompt } from './llmPrompt';
import type { InlineCompletionProvider } from './llmProvider';

const inlineCompletionInstructions = [
  'You are an inline completion engine for a Markdown editor.',
  'Return only the exact text to insert at the cursor.',
  'Do not include explanations, Markdown fences, or text already present around the cursor.'
].join(' ');

export const openAiSdkProvider: InlineCompletionProvider = {
  name: 'openai-sdk',
  complete: async (request, config, signal, options) => {
    if (!config.llmModel.trim()) return null;

    const client = new OpenAI({
      apiKey: config.llmApiKey.trim() || undefined,
      baseURL: config.llmEndpoint.trim() || undefined,
      maxRetries: 0,
      timeout: config.llmRequestTimeoutMs
    });

    const params = {
      model: config.llmModel,
      messages: [
        {
          role: 'system' as const,
          content: inlineCompletionInstructions
        },
        {
          role: 'user' as const,
          content: buildInlineCompletionPrompt(request)
        }
      ],
      temperature: 0.2,
      max_tokens: 128
    };

    if (options?.onDelta) {
      const stream = await client.chat.completions.create(
        {
          ...params,
          stream: true
        },
        { signal }
      );
      let text = '';
      let responseId = `openai-sdk-${request.cursorOffset}`;
      let model = config.llmModel;
      for await (const chunk of stream) {
        responseId = chunk.id || responseId;
        model = chunk.model || model;
        const delta = chunk.choices[0]?.delta.content ?? '';
        if (!delta) continue;
        text += delta;
        options.onDelta(delta);
      }
      console.log('OpenAI inline completion output:', text);
      if (!text.trim()) return null;

      return {
        id: responseId,
        text,
        provider: 'openai-sdk',
        model
      };
    }

    const response = await client.chat.completions.create(
      {
        ...params,
        stream: false
      },
      { signal }
    );

    const text = response.choices[0]?.message.content ?? '';
    console.log('OpenAI inline completion output:', text);
    if (!text.trim()) return null;

    return {
      id: response.id,
      text,
      provider: 'openai-sdk',
      model: response.model
    };
  }
};
