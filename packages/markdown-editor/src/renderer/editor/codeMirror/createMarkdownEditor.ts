import type { CompletionSource } from '@codemirror/autocomplete';
import { autocompletion } from '@codemirror/autocomplete';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { latexCompletion, tagCompletion } from './completions';
import { markdownDecorationPlugin } from './markdownDecorations';
import { markdownEditorTheme } from './editorTheme';
import { markdownTabEditingExtension } from './markdownTabEditing';
import { tableEditingExtension } from './tableEditing/tableEditingExtension';
import {
  inlineCompletionExtension,
  type InlineCompletionRequester
} from '../inlineCompletion/inlineCompletionExtension';
import { imagePasteExtension, type SavePastedImageRequester } from './imagePasteExtension';

export interface MarkdownEditorInstance {
  view: EditorView;
  updateContent: (content: string) => void;
  destroy: () => void;
}

export interface CreateMarkdownEditorOptions {
  parent: HTMLElement;
  content: string;
  onChange: (content: string) => void;
  completionSources?: CompletionSource[];
  editorExtensions?: Extension[];
  requestInlineCompletion?: InlineCompletionRequester;
  savePastedImage?: SavePastedImageRequester;
  inlineCompletionDebounceMs?: number;
  inlineCompletionMaxPrefixChars?: number;
  inlineCompletionMaxSuffixChars?: number;
  isLargeDocument?: boolean;
  ariaLabel?: string;
}

export const createMarkdownEditor = ({
  parent,
  content,
  onChange,
  completionSources = [],
  editorExtensions = [],
  requestInlineCompletion,
  savePastedImage,
  inlineCompletionDebounceMs,
  inlineCompletionMaxPrefixChars,
  inlineCompletionMaxSuffixChars,
  isLargeDocument = false,
  ariaLabel
}: CreateMarkdownEditorOptions): MarkdownEditorInstance => {
  const startedAt = performance.now();
  const state = EditorState.create({
    doc: content,
    extensions: [
      basicSetup,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange(update.state.doc.toString());
      }),
      ariaLabel ? EditorView.contentAttributes.of({ 'aria-label': ariaLabel }) : [],
      markdownEditorTheme,
      markdownDecorationPlugin({ largeDocument: isLargeDocument }),
      autocompletion({
        override: [...completionSources, latexCompletion, tagCompletion]
      }),
      inlineCompletionExtension({
        requestInlineCompletion,
        debounceMs: inlineCompletionDebounceMs,
        maxPrefixChars: inlineCompletionMaxPrefixChars,
        maxSuffixChars: inlineCompletionMaxSuffixChars
      }),
      tableEditingExtension(),
      markdownTabEditingExtension(),
      imagePasteExtension(savePastedImage),
      ...editorExtensions,
      EditorView.lineWrapping
    ]
  });

  const view = new EditorView({ state, parent });
  if (import.meta.env.DEV) {
    console.debug('Editor mount', Math.round(performance.now() - startedAt), 'ms');
  }

  return {
    view,
    updateContent: (nextContent: string) => {
      const current = view.state.doc.toString();
      if (current === nextContent) return;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: nextContent
        }
      });
    },
    destroy: () => view.destroy()
  };
};
