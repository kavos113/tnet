import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
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
        getScroller: () => containerRef.current?.querySelector<HTMLElement>('.cm-scroller') ?? null
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
