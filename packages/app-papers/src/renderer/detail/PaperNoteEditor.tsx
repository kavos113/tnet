import { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownEditorSurface, type MarkdownEditorMode } from '@tnet/markdown-editor/renderer';
import type { PapersLibraryConfig } from '@tnet/app-papers/shared/config';

export interface PaperNoteEditorProps {
  paperId: string;
  content: string;
  mode: MarkdownEditorMode;
  autoSaveDebounceMs: number;
  editorFontFamily: string;
  editorFontSize: number;
  previewFontFamily: string;
  previewFontSize: number;
  onModeChange: (mode: PapersLibraryConfig['noteEditorMode']) => void;
  onSave: (content: string) => Promise<void>;
}

export const PaperNoteEditor = ({
  paperId,
  content,
  mode,
  autoSaveDebounceMs,
  editorFontFamily,
  editorFontSize,
  previewFontFamily,
  previewFontSize,
  onModeChange,
  onSave
}: PaperNoteEditorProps): React.JSX.Element => {
  const [draft, setDraft] = useState(content);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialContentRef = useRef(content);
  const editorOptions = useMemo(() => ({ ariaLabel: 'Paper note' }), []);
  const previewOptions = useMemo(() => ({ renderDebounceMs: 120 }), []);

  useEffect(() => {
    initialContentRef.current = content;
    setDraft(content);
    setStatus('idle');
  }, [content, paperId]);

  useEffect(() => {
    if (draft === initialContentRef.current) return;

    const timeoutId = window.setTimeout(() => {
      setStatus('saving');
      onSave(draft)
        .then(() => {
          initialContentRef.current = draft;
          setStatus('saved');
        })
        .catch((error: unknown) => {
          console.error('Failed to save paper note', error);
          setStatus('error');
        });
    }, autoSaveDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoSaveDebounceMs, draft, onSave]);

  return (
    <section
      className="papers-note-panel"
      aria-label="Paper note editor"
      style={
        {
          '--editor-font-family': editorFontFamily,
          '--editor-font-size': `${editorFontSize}px`,
          '--preview-font-family': previewFontFamily,
          '--preview-font-size': `${previewFontSize}px`
        } as React.CSSProperties
      }
    >
      <div className="papers-note-toolbar" aria-label="Paper note view mode">
        {(['editor', 'split', 'preview'] as const).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            className={mode === nextMode ? 'active' : ''}
            aria-pressed={mode === nextMode}
            onClick={() => onModeChange(nextMode)}
          >
            {nextMode === 'editor' ? 'Editor' : nextMode === 'split' ? 'Split' : 'Preview'}
          </button>
        ))}
      </div>
      <MarkdownEditorSurface
        className="papers-note-editor"
        mode={mode}
        content={draft}
        onChange={setDraft}
        editor={editorOptions}
        preview={previewOptions}
      />
      <span className={`papers-note-status papers-note-status-${status}`} aria-live="polite">
        {status === 'saving'
          ? 'Saving...'
          : status === 'saved'
            ? 'Saved'
            : status === 'error'
              ? 'Save failed'
              : ''}
      </span>
    </section>
  );
};
