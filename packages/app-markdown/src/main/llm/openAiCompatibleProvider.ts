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

interface ChatCompletionStreamChunk {
  id?: string;
  model?: string;
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
    text?: string;
  }>;
}

const defaultChatCompletionsEndpoint = 'https://api.openai.com/v1/chat/completions';

export const openAiCompatibleProvider: InlineCompletionProvider = {
  name: 'openai-compatible',
  complete: async (request, config, signal, options) => {
    if (!config.llmModel.trim()) return null;

    const endpoint = config.llmEndpoint.trim() || defaultChatCompletionsEndpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (config.llmApiKey.trim()) {
      headers.Authorization = `Bearer ${config.llmApiKey.trim()}`;
    }

    const body = {
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
      max_tokens: 128,
      ...(options?.onDelta ? { stream: true } : {})
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) return null;

    if (options?.onDelta) {
      const streamed = await readOpenAiCompatibleStream(
        response,
        config.llmModel,
        request.cursorOffset,
        options.onDelta
      );
      console.log('OpenAI-compatible inline completion output:', streamed.text);
      if (!streamed.text.trim()) return null;

      return {
        id: streamed.id,
        text: streamed.text,
        provider: 'openai-compatible',
        model: streamed.model
      };
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const text = payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text ?? '';
    console.log('OpenAI-compatible inline completion output:', text);
    if (!text.trim()) return null;

    return {
      id: payload.id ?? `openai-compatible-${request.cursorOffset}`,
      text,
      provider: 'openai-compatible',
      model: payload.model ?? config.llmModel
    };
  }
};

const readOpenAiCompatibleStream = async (
  response: Response,
  fallbackModel: string,
  cursorOffset: number,
  onDelta: (delta: string) => void
): Promise<{ id: string; text: string; model: string }> => {
  if (!response.body) {
    return { id: `openai-compatible-${cursorOffset}`, text: '', model: fallbackModel };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let id = `openai-compatible-${cursorOffset}`;
  let model = fallbackModel;

  const processEvent = (eventText: string): boolean => {
    const dataLines = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());

    for (const dataLine of dataLines) {
      if (!dataLine) continue;
      if (dataLine === '[DONE]') return true;

      const chunk = JSON.parse(dataLine) as ChatCompletionStreamChunk;
      id = chunk.id ?? id;
      model = chunk.model ?? model;
      const delta =
        chunk.choices?.[0]?.delta?.content ??
        chunk.choices?.[0]?.message?.content ??
        chunk.choices?.[0]?.text ??
        '';
      if (!delta) continue;
      text += delta;
      onDelta(delta);
    }

    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? '';
    for (const eventText of events) {
      if (processEvent(eventText)) return { id, text, model };
    }

    if (done) break;
  }

  if (buffer.trim()) processEvent(buffer);
  return { id, text, model };
};
