import type { InlineCompletionProvider } from './llmProvider';

export const mockInlineCompletionProvider: InlineCompletionProvider = {
  name: 'mock',
  complete: async (request, _config, signal, options) => {
    if (signal.aborted) return null;
    const lastLine = request.prefix.split(/\r?\n/).at(-1)?.trim() ?? '';
    if (!lastLine || request.trigger !== 'manual') return null;
    const text = ' completed by inline LLM';
    options?.onDelta?.(text);

    return {
      id: `mock-${request.cursorOffset}`,
      text,
      provider: 'mock',
      model: 'mock-inline-completion'
    };
  }
};
