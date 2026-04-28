import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { tagCompletions } from './tagCompletionData';

export const tagCompletion = (context: CompletionContext): CompletionResult | null => {
  const match = context.matchBefore(/<([a-zA-Z]*)$/);
  if (!match) return null;

  const word = match.text.slice(1).toLowerCase();
  return {
    from: match.from + 1,
    options: tagCompletions.filter((item) => item.apply?.toString().toLowerCase().startsWith(word)),
    validFor: /^<([a-zA-Z]*)$/
  };
};
