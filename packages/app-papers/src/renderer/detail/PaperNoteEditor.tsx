import { useEffect, useRef, useState } from 'react';

export interface PaperNoteEditorProps {
  paperId: string;
  content: string;
  autoSaveDebounceMs: number;
  onSave: (content: string) => Promise<void>;
}

export const PaperNoteEditor = ({
  paperId,
  content,
  autoSaveDebounceMs,
  onSave
}: PaperNoteEditorProps): React.JSX.Element => {
  const [draft, setDraft] = useState(content);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialContentRef = useRef(content);

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
    <section className="papers-note-panel" aria-label="Paper note editor">
      <textarea
        className="papers-note-editor"
        value={draft}
        aria-label="Paper note"
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
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
