import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import { InlineCompletionWidget } from './inlineCompletionWidget';

export interface InlineCompletionGhostText {
  id: string;
  text: string;
  from: number;
}

export const setInlineCompletionEffect = StateEffect.define<InlineCompletionGhostText>();
export const clearInlineCompletionEffect = StateEffect.define<void>();

export const inlineCompletionState = StateField.define<InlineCompletionGhostText | null>({
  create: () => null,
  update: (value, transaction) => {
    for (const effect of transaction.effects) {
      if (effect.is(setInlineCompletionEffect)) return effect.value;
      if (effect.is(clearInlineCompletionEffect)) return null;
    }

    if (transaction.docChanged || transaction.selection) return null;
    return value;
  }
});

export const inlineCompletionDecorations = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (_decorations, transaction) => {
    const completion = transaction.state.field(inlineCompletionState);
    if (!completion) return Decoration.none;

    return Decoration.set([
      Decoration.widget({
        widget: new InlineCompletionWidget(completion.text),
        side: 1
      }).range(completion.from)
    ]);
  },
  provide: (field) => EditorView.decorations.from(field)
});
