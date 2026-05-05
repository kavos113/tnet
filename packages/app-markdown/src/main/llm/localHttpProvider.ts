import type { InlineCompletionProvider } from './llmProvider';

interface LocalHttpInlineCompletionResponse {
  id?: string;
  text?: string;
  completion?: string;
  model?: string;
}

export const localHttpProvider: InlineCompletionProvider = {
  name: 'local-http',
  complete: async (request, config, signal, options) => {
    if (!config.llmEndpoint.trim()) return null;

    const response = await fetch(config.llmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        model: config.llmModel
      }),
      signal
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as LocalHttpInlineCompletionResponse;
    const text = payload.text ?? payload.completion ?? '';
    console.log('Local HTTP inline completion output:', text);
    if (!text.trim()) return null;
    options?.onDelta?.(text);

    return {
      id: payload.id ?? `local-http-${request.cursorOffset}`,
      text,
      provider: 'local-http',
      model: payload.model ?? config.llmModel
    };
  }
};
