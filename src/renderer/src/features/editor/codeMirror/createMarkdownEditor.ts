import { autocompletion } from '@codemirror/autocomplete';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { keywordCompletion, latexCompletion, tagCompletion } from './completions';
import { markdownDecorationPlugin } from './markdownDecorations';
import { markdownEditorTheme } from './editorTheme';

export interface MarkdownEditorInstance {
  view: EditorView;
  updateContent: (content: string) => void;
  destroy: () => void;
}

interface CreateMarkdownEditorOptions {
  parent: HTMLElement;
  content: string;
  rootDir: string;
  onChange: (content: string) => void;
}

export const createMarkdownEditor = ({
  parent,
  content,
  rootDir,
  onChange
}: CreateMarkdownEditorOptions): MarkdownEditorInstance => {
  const state = EditorState.create({
    doc: content,
    extensions: [
      basicSetup,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChange(update.state.doc.toString());
      }),
      markdownEditorTheme,
      markdownDecorationPlugin,
      autocompletion({
        override: [keywordCompletion(rootDir), latexCompletion, tagCompletion]
      }),
      EditorView.lineWrapping
    ]
  });

  const view = new EditorView({ state, parent });

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
