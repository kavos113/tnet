import type { InlineCompletionProvider } from './llmProvider';

export const mockInlineCompletionProvider: InlineCompletionProvider = {
  name: 'mock',
  complete: async (request, _config, signal) => {
    if (signal.aborted) return null;
    const lastLine = request.prefix.split(/\r?\n/).at(-1)?.trim() ?? '';
    if (!lastLine || request.trigger !== 'manual') return null;

    return {
      id: `mock-${request.cursorOffset}`,
      text: ' completed by inline LLM',
      provider: 'mock',
      model: 'mock-inline-completion'
    };
  }
};
