import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  createMarkdownEditor,
  type MarkdownEditorInstance
} from './codeMirror/createMarkdownEditor';
import type { KeywordIndexLoader } from './codeMirror/completions';

interface EditorPaneProps {
  content: string;
  onChange: (content: string) => void;
  loadKeywordIndex: KeywordIndexLoader;
}

export interface EditorPaneHandle {
  getScroller: () => HTMLElement | null;
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  ({ content, onChange, loadKeywordIndex }, ref): React.JSX.Element => {
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
        loadKeywordIndex
      });

      return () => {
        editorRef.current?.destroy();
        editorRef.current = null;
      };
    }, [loadKeywordIndex]);

    useEffect(() => {
      editorRef.current?.updateContent(content);
    }, [content]);

    return <div ref={containerRef} className="codemirror-container" />;
  }
);

EditorPane.displayName = 'EditorPane';
