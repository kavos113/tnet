import type { EditorState } from '@codemirror/state';
import { buildInlineCompletionContext } from '@shared/llm/inlineCompletionContext';
import type {
  InlineCompletionContext,
  InlineCompletionTrigger
} from '@shared/llm/inlineCompletionTypes';

export const buildEditorInlineCompletionContext = (
  state: EditorState,
  trigger: InlineCompletionTrigger
): InlineCompletionContext => {
  const selection = state.selection.main;
  return buildInlineCompletionContext({
    documentText: state.doc.toString(),
    cursorOffset: selection.head,
    selectionFrom: selection.from,
    selectionTo: selection.to,
    trigger
  });
};
