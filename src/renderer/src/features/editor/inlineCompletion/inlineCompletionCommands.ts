import type { EditorView } from '@codemirror/view';
import { clearInlineCompletionEffect, inlineCompletionState } from './inlineCompletionState';

export const acceptInlineCompletion = ({ state, dispatch }: EditorView): boolean => {
  const completion = state.field(inlineCompletionState);
  if (!completion) return false;

  dispatch({
    changes: { from: completion.from, insert: completion.text },
    effects: clearInlineCompletionEffect.of()
  });
  return true;
};

export const rejectInlineCompletion = ({ state, dispatch }: EditorView): boolean => {
  if (!state.field(inlineCompletionState)) return false;
  dispatch({ effects: clearInlineCompletionEffect.of() });
  return true;
};
