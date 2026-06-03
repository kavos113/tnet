import OpenAI from 'openai';
import { buildInlineCompletionPrompt } from './llmPrompt';
import type { InlineCompletionProvider } from './llmProvider';

const defaultLmStudioBaseUrl = 'http://localhost:1234/v1';

const inlineCompletionInstructions = [
  'You are an inline completion engine for a Markdown editor.',
  'Return only the exact text to insert at the cursor.',
  'Do not include explanations, Markdown fences, or text already present around the cursor.'
].join(' ');

export const lmStudioProvider: InlineCompletionProvider = {
  name: 'lm-studio',
  complete: async (request, config, signal, options) => {
    if (!config.llmModel.trim()) return null;

    const client = new OpenAI({
      apiKey: config.llmApiKey.trim() || 'lm-studio',
      baseURL: config.llmEndpoint.trim() || defaultLmStudioBaseUrl,
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
      let responseId = `lm-studio-${request.cursorOffset}`;
      let model = config.llmModel;
      for await (const chunk of stream) {
        responseId = chunk.id || responseId;
        model = chunk.model || model;
        const delta = chunk.choices[0]?.delta.content ?? '';
        if (!delta) continue;
        text += delta;
        options.onDelta(delta);
        console.log('LM Studio inline completion delta:', delta);
      }
      console.log('LM Studio inline completion output:', text);
      if (!text.trim()) return null;

      return {
        id: responseId,
        text,
        provider: 'lm-studio',
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
    console.log('LM Studio inline completion output:', text);
    if (!text.trim()) return null;

    return {
      id: response.id,
      text,
      provider: 'lm-studio',
      model: response.model
    };
  }
};
