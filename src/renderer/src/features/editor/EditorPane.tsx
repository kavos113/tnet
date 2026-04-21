import { useEffect, useRef } from 'react';
import {
  createMarkdownEditor,
  type MarkdownEditorInstance
} from './codeMirror/createMarkdownEditor';

interface EditorPaneProps {
  content: string;
  rootDir: string;
  onChange: (content: string) => void;
}

export const EditorPane = ({ content, rootDir, onChange }: EditorPaneProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MarkdownEditorInstance | null>(null);

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
};
