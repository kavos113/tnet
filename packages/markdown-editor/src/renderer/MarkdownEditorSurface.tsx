import { useCallback, useRef, useState, type CSSProperties } from 'react';
import type {
  MarkdownEditorPaneHandle,
  MarkdownEditorPaneProps
} from './editor/MarkdownEditorPane';
import { MarkdownEditorPane } from './editor/MarkdownEditorPane';
import type {
  MarkdownPreviewPaneHandle,
  MarkdownPreviewPaneProps
} from './preview/MarkdownPreviewPane';
import { MarkdownPreviewPane } from './preview/MarkdownPreviewPane';

export type MarkdownEditorMode = 'editor' | 'split' | 'preview';

export interface MarkdownEditorSurfaceProps {
  mode: MarkdownEditorMode;
  content: string;
  onChange: (content: string) => void;
  editor?: Omit<MarkdownEditorPaneProps, 'content' | 'onChange'>;
  preview?: Omit<MarkdownPreviewPaneProps, 'markdown'>;
  className?: string;
}

export interface MarkdownEditorSurfaceHandle {
  getEditor: () => MarkdownEditorPaneHandle | null;
  getPreview: () => MarkdownPreviewPaneHandle | null;
}

export const MarkdownEditorSurface = ({
  mode,
  content,
  onChange,
  editor,
  preview,
  className
}: MarkdownEditorSurfaceProps): React.JSX.Element => {
  const editorRef = useRef<MarkdownEditorPaneHandle | null>(null);
  const previewRef = useRef<MarkdownPreviewPaneHandle | null>(null);
  const [editorWidthPercent, setEditorWidthPercent] = useState(50);
  const previewWidthPercent = 100 - editorWidthPercent;

  const startResize = useCallback((event: React.MouseEvent<HTMLElement>): void => {
    event.preventDefault();
    const container = event.currentTarget.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const next = rect.width <= 0 ? 50 : ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setEditorWidthPercent(Math.min(80, Math.max(20, next)));
    };
    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className={`markdown-editor-surface ${className ?? ''}`.trim()}>
      {mode !== 'preview' ? (
        <div
          className="markdown-editor-surface-pane markdown-editor-surface-editor"
          style={
            {
              width: mode === 'split' ? `${editorWidthPercent}%` : '100%'
            } as CSSProperties
          }
        >
          <MarkdownEditorPane ref={editorRef} content={content} onChange={onChange} {...editor} />
        </div>
      ) : null}
      {mode === 'split' ? (
        <div
          className="markdown-editor-surface-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor and preview"
          onMouseDown={startResize}
        />
      ) : null}
      {mode !== 'editor' ? (
        <div
          className="markdown-editor-surface-pane markdown-editor-surface-preview"
          style={
            {
              width: mode === 'split' ? `${previewWidthPercent}%` : '100%'
            } as CSSProperties
          }
        >
          <MarkdownPreviewPane ref={previewRef} markdown={content} {...preview} />
        </div>
      ) : null}
    </div>
  );
};
