import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  createMarkdownEditor,
  type MarkdownEditorInstance
} from './codeMirror/createMarkdownEditor';

interface EditorPaneProps {
  content: string;
  rootDir: string;
  onChange: (content: string) => void;
}

export interface EditorPaneHandle {
  getScroller: () => HTMLElement | null;
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  ({ content, rootDir, onChange }, ref): React.JSX.Element => {
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
        rootDir,
        onChange
      });

      return () => {
        editorRef.current?.destroy();
        editorRef.current = null;
      };
    }, [rootDir]);

    useEffect(() => {
      editorRef.current?.updateContent(content);
    }, [content]);

    return <div ref={containerRef} className="codemirror-container" />;
  }
);

EditorPane.displayName = 'EditorPane';
