import { autocompletion } from '@codemirror/autocomplete';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import {
  keywordCompletion,
  latexCompletion,
  tagCompletion,
  type KeywordIndexLoader
} from './completions';
import { markdownDecorationPlugin } from './markdownDecorations';
import { markdownEditorTheme } from './editorTheme';
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

interface CreateMarkdownEditorOptions {
  parent: HTMLElement;
  content: string;
  onChange: (content: string) => void;
  loadKeywordIndex: KeywordIndexLoader;
  requestInlineCompletion?: InlineCompletionRequester;
  savePastedImage?: SavePastedImageRequester;
  inlineCompletionDebounceMs?: number;
  inlineCompletionMaxPrefixChars?: number;
  inlineCompletionMaxSuffixChars?: number;
  isLargeDocument?: boolean;
}

export const createMarkdownEditor = ({
  parent,
  content,
  onChange,
  loadKeywordIndex,
  requestInlineCompletion,
  savePastedImage,
  inlineCompletionDebounceMs,
  inlineCompletionMaxPrefixChars,
  inlineCompletionMaxSuffixChars,
  isLargeDocument = false
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
      markdownEditorTheme,
      markdownDecorationPlugin({ largeDocument: isLargeDocument }),
      autocompletion({
        override: [keywordCompletion(loadKeywordIndex), latexCompletion, tagCompletion]
      }),
      inlineCompletionExtension({
        requestInlineCompletion,
        debounceMs: inlineCompletionDebounceMs,
        maxPrefixChars: inlineCompletionMaxPrefixChars,
        maxSuffixChars: inlineCompletionMaxSuffixChars
      }),
      imagePasteExtension(savePastedImage),
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
