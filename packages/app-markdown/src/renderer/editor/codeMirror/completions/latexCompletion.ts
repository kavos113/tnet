import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { latexCompletions } from './latexCompletionData';

export const latexCompletion = (context: CompletionContext): CompletionResult | null => {
  const match = context.matchBefore(/\\([a-zA-Z]*)$/);
  if (!match) return null;

  const word = match.text.toLowerCase();
  return {
    from: match.from + 1,
    options: latexCompletions.filter((item) => item.label.toLowerCase().startsWith(word)),
    validFor: /^\\([a-zA-Z]*)$/
  };
};
