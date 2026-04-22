import { buildInlineCompletionPrompt } from './llmPrompt';
import type { InlineCompletionProvider } from './llmProvider';

interface ChatCompletionResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
    text?: string;
  }>;
}

const defaultChatCompletionsEndpoint = 'https://api.openai.com/v1/chat/completions';

export const openAiCompatibleProvider: InlineCompletionProvider = {
  name: 'openai-compatible',
  complete: async (request, config, signal) => {
    if (!config.llmModel.trim()) return null;

    const endpoint = config.llmEndpoint.trim() || defaultChatCompletionsEndpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.llmApiKey.trim()) {
      headers.Authorization = `Bearer ${config.llmApiKey.trim()}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          {
            role: 'system',
            content: 'You are an inline completion engine for a Markdown editor.'
          },
          {
            role: 'user',
            content: buildInlineCompletionPrompt(request)
          }
        ],
        temperature: 0.2,
        max_tokens: 128
      }),
      signal
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as ChatCompletionResponse;
    const text = payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text ?? '';
    if (!text.trim()) return null;

    return {
      id: payload.id ?? `openai-compatible-${request.cursorOffset}`,
      text,
      provider: 'openai-compatible',
      model: payload.model ?? config.llmModel
    };
  }
};
