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
  complete: async (request, config, signal) => {
    if (!config.llmModel.trim()) return null;

    const client = new OpenAI({
      apiKey: config.llmApiKey.trim() || undefined,
      baseURL: config.llmEndpoint.trim() || undefined,
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
      provider: 'openai-sdk',
      model: response.model ?? config.llmModel
    };
  }
};
