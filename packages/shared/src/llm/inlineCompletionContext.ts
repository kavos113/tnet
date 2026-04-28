import type { InlineCompletionContext, InlineCompletionTrigger } from './inlineCompletionTypes';

export interface BuildInlineCompletionContextOptions {
  documentText: string;
  cursorOffset: number;
  selectionFrom?: number;
  selectionTo?: number;
  trigger: InlineCompletionTrigger;
  maxPrefixChars?: number;
  maxSuffixChars?: number;
}

export const defaultMaxInlineCompletionPrefixChars = 6000;
export const defaultMaxInlineCompletionSuffixChars = 1500;

export const buildInlineCompletionContext = ({
  documentText,
  cursorOffset,
  selectionFrom = cursorOffset,
  selectionTo = cursorOffset,
  trigger,
  maxPrefixChars = defaultMaxInlineCompletionPrefixChars,
  maxSuffixChars = defaultMaxInlineCompletionSuffixChars
}: BuildInlineCompletionContextOptions): InlineCompletionContext => {
  const from = Math.max(0, Math.min(selectionFrom, selectionTo, documentText.length));
  const to = Math.max(0, Math.min(Math.max(selectionFrom, selectionTo), documentText.length));
  const offset = Math.max(0, Math.min(cursorOffset, documentText.length));
  const prefixStart = Math.max(0, offset - maxPrefixChars);
  const suffixEnd = Math.min(documentText.length, offset + maxSuffixChars);

  return {
    prefix: documentText.slice(prefixStart, offset),
    suffix: documentText.slice(offset, suffixEnd),
    selectedText: from === to ? '' : documentText.slice(from, to),
    cursorOffset: offset,
    trigger
  };
};
