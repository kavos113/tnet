import type { EditorState } from '@codemirror/state';
import { buildInlineCompletionContext } from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionContext';
import type {
  InlineCompletionContext,
  InlineCompletionTrigger
} from '@tnet/markdown-editor/shared/inlineCompletion/inlineCompletionTypes';

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
