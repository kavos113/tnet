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
  complete: async (request, config, signal) => {
    if (!config.llmModel.trim()) return null;

    const client = new OpenAI({
      apiKey: config.llmApiKey.trim() || 'lm-studio',
      baseURL: config.llmEndpoint.trim() || defaultLmStudioBaseUrl,
      maxRetries: 0,
      timeout: config.llmRequestTimeoutMs
    });

    const response = await client.responses.create(
      {
        model: config.llmModel,
        instructions: inlineCompletionInstructions,
        input: buildInlineCompletionPrompt(request),
        temperature: 0.2,
        max_output_tokens: 128
      },
      { signal }
    );

    const text = response.output_text;
    if (!text.trim()) return null;

    return {
      id: response.id,
      text,
      provider: 'lm-studio',
      model: response.model ?? config.llmModel
    };
  }
};
