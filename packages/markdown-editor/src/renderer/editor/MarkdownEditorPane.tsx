import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CompletionSource } from '@codemirror/autocomplete';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  createMarkdownEditor,
  type MarkdownEditorInstance
} from './codeMirror/createMarkdownEditor';
import type { SavePastedImageRequester } from './codeMirror/imagePasteExtension';
import type { InlineCompletionRequester } from './inlineCompletion/inlineCompletionExtension';
import styles from './MarkdownEditorPane.module.css';

export interface MarkdownEditorPaneProps {
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

export interface MarkdownEditorPaneHandle {
  getScroller: () => HTMLElement | null;
  getView: () => EditorView | null;
  revealLine: (lineNumber: number) => boolean;
}

export const MarkdownEditorPane = forwardRef<MarkdownEditorPaneHandle, MarkdownEditorPaneProps>(
  (
    {
      content,
      onChange,
      completionSources,
      editorExtensions,
      requestInlineCompletion,
      savePastedImage,
      inlineCompletionDebounceMs,
      inlineCompletionMaxPrefixChars,
      inlineCompletionMaxSuffixChars,
      isLargeDocument,
      ariaLabel
    },
    ref
  ): React.JSX.Element => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<MarkdownEditorInstance | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

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
        onChange: (nextContent) => onChangeRef.current(nextContent),
        completionSources,
        editorExtensions,
        requestInlineCompletion,
        savePastedImage,
        inlineCompletionDebounceMs,
        inlineCompletionMaxPrefixChars,
        inlineCompletionMaxSuffixChars,
        isLargeDocument,
        ariaLabel
      });

      return () => {
        editorRef.current?.destroy();
        editorRef.current = null;
      };
    }, [
      completionSources,
      editorExtensions,
      inlineCompletionDebounceMs,
      inlineCompletionMaxPrefixChars,
      inlineCompletionMaxSuffixChars,
      isLargeDocument,
      ariaLabel,
      requestInlineCompletion,
      savePastedImage
    ]);

    useEffect(() => {
      editorRef.current?.updateContent(content);
    }, [content]);

    return <div ref={containerRef} className={styles.container} />;
  }
);

MarkdownEditorPane.displayName = 'MarkdownEditorPane';
