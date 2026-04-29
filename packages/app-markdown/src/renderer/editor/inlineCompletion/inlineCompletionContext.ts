import type { EditorState } from '@codemirror/state';
import { buildInlineCompletionContext } from '@tnet/app-markdown/shared/llm/inlineCompletionContext';
import type {
  InlineCompletionContext,
  InlineCompletionTrigger
} from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';

export const buildEditorInlineCompletionContext = (
  state: EditorState,
  trigger: InlineCompletionTrigger,
  options: {
    maxPrefixChars?: number;
    maxSuffixChars?: number;
  } = {}
): InlineCompletionContext => {
  const selection = state.selection.main;
  return buildInlineCompletionContext({
    documentText: state.doc.toString(),
    cursorOffset: selection.head,
    selectionFrom: selection.from,
    selectionTo: selection.to,
    trigger,
    maxPrefixChars: options.maxPrefixChars,
    maxSuffixChars: options.maxSuffixChars
  });
};
