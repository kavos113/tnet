import { GoogleGenAI } from '@google/genai';
import { buildInlineCompletionPrompt } from './llmPrompt';
import type { InlineCompletionProvider } from './llmProvider';

const inlineCompletionInstructions = [
  'You are an inline completion engine for a Markdown editor.',
  'Return only the exact text to insert at the cursor.',
  'Do not include explanations, Markdown fences, or text already present around the cursor.'
].join(' ');

export const geminiSdkProvider: InlineCompletionProvider = {
  name: 'gemini-sdk',
  complete: async (request, config, signal, options) => {
    if (!config.llmModel.trim()) return null;

    const ai = new GoogleGenAI({
      apiKey: config.llmApiKey.trim() || undefined,
      httpOptions: {
        baseUrl: config.llmEndpoint.trim() || undefined,
        timeout: config.llmRequestTimeoutMs
      }
    });

    const params = {
      model: config.llmModel,
      contents: buildInlineCompletionPrompt(request),
      config: {
        systemInstruction: inlineCompletionInstructions,
        temperature: 0.2,
        maxOutputTokens: 128,
        abortSignal: signal
      }
    };

    if (options?.onDelta) {
      const stream = await ai.models.generateContentStream(params);
      let text = '';
      let responseId = `gemini-sdk-${request.cursorOffset}`;
      let model = config.llmModel;
      for await (const response of stream) {
        responseId = response.responseId ?? responseId;
        model = response.modelVersion ?? model;
        const delta = response.text ?? '';
        if (!delta) continue;
        text += delta;
        options.onDelta(delta);
      }
      console.log('Gemini inline completion output:', text);
      if (!text.trim()) return null;

      return {
        id: responseId,
        text,
        provider: 'gemini-sdk',
        model
      };
    }

    const response = await ai.models.generateContent(params);

    const text = response.text ?? '';
    console.log('Gemini inline completion output:', text);
    if (!text.trim()) return null;

    return {
      id: response.responseId ?? `gemini-sdk-${request.cursorOffset}`,
      text,
      provider: 'gemini-sdk',
      model: response.modelVersion ?? config.llmModel
    };
  }
};
