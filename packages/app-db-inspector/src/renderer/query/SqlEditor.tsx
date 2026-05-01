import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

interface SqlEditorProps {
  value: string;
  queryFontFamily?: string;
  queryFontSize?: number;
  onChange: (value: string) => void;
}

export const SqlEditor = ({
  onChange,
  queryFontFamily,
  queryFontSize,
  value
}: SqlEditorProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          basicSetup,
          closeBrackets(),
          keymap.of(closeBracketsKeymap),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            '&': {
              minHeight: '150px',
              height: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            },
            '.cm-content': {
              minHeight: '150px',
              fontFamily: queryFontFamily || 'monospace',
              fontSize: `${queryFontSize && queryFontSize > 0 ? queryFontSize : 13}px`,
              lineHeight: '1.45',
              padding: '6px 8px'
            },
            '.cm-gutters': {
              backgroundColor: 'var(--background-dark)',
              color: 'var(--foreground-muted)',
              borderRight: '1px solid var(--color-border)'
            },
            '.cm-activeLine': {
              backgroundColor: 'transparent'
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'var(--background)'
            },
            '.cm-scroller': {
              overflow: 'auto'
            }
          })
        ]
      })
    });

    view.dom.setAttribute('aria-label', 'SQL editor');
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [queryFontFamily, queryFontSize]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === value) return;

    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value
      }
    });
  }, [value]);

  return <div ref={containerRef} />;
};
