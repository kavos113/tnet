import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import {
  createMarkdownEditor,
  type MarkdownEditorInstance
} from './codeMirror/createMarkdownEditor';
import type { KeywordIndexLoader } from './codeMirror/completions';
import type { SavePastedImageRequester } from './codeMirror/imagePasteExtension';
import type { InlineCompletionRequester } from './inlineCompletion/inlineCompletionExtension';

interface EditorPaneProps {
  content: string;
  onChange: (content: string) => void;
  loadKeywordIndex: KeywordIndexLoader;
  requestInlineCompletion?: InlineCompletionRequester;
  savePastedImage?: SavePastedImageRequester;
  inlineCompletionDebounceMs?: number;
  inlineCompletionMaxPrefixChars?: number;
  inlineCompletionMaxSuffixChars?: number;
}

export interface EditorPaneHandle {
  getScroller: () => HTMLElement | null;
  getView: () => EditorView | null;
  revealLine: (lineNumber: number) => boolean;
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  (
    {
      content,
      onChange,
      loadKeywordIndex,
      requestInlineCompletion,
      savePastedImage,
      inlineCompletionDebounceMs,
      inlineCompletionMaxPrefixChars,
      inlineCompletionMaxSuffixChars
    },
    ref
  ): React.JSX.Element => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<MarkdownEditorInstance | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        getScroller: () => containerRef.current?.querySelector<HTMLElement>('.cm-scroller') ?? null,
        getView: () => editorRef.current?.view ?? null,
        revealLine: (lineNumber: number) => {
          const view = editorRef.current?.view;
          if (!view) return false;

          const clampedLine = Math.min(Math.max(1, lineNumber), view.state.doc.lines);
          const line = view.state.doc.line(clampedLine);
          view.dispatch({
            selection: { anchor: line.from },
            effects: EditorView.scrollIntoView(line.from, { y: 'center' })
          });
          view.focus();
          return true;
        }
      }),
      []
    );

    useEffect(() => {
      if (!containerRef.current) return;

      editorRef.current = createMarkdownEditor({
        parent: containerRef.current,
        content,
        onChange,
        loadKeywordIndex,
        requestInlineCompletion,
        savePastedImage,
        inlineCompletionDebounceMs,
        inlineCompletionMaxPrefixChars,
        inlineCompletionMaxSuffixChars
      });

      return () => {
        editorRef.current?.destroy();
        editorRef.current = null;
      };
    }, [
      inlineCompletionDebounceMs,
      inlineCompletionMaxPrefixChars,
      inlineCompletionMaxSuffixChars,
      loadKeywordIndex,
      requestInlineCompletion,
      savePastedImage
    ]);

    useEffect(() => {
      editorRef.current?.updateContent(content);
    }, [content]);

    return <div ref={containerRef} className="codemirror-container" />;
  }
);

EditorPane.displayName = 'EditorPane';
