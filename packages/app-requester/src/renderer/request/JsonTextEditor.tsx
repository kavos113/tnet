import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

interface JsonTextEditorProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

export const JsonTextEditor = ({
  ariaLabel,
  value,
  onChange,
  minHeight = 160
}: JsonTextEditorProps): React.JSX.Element => {
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
          json(),
          closeBrackets(),
          keymap.of(closeBracketsKeymap),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              minHeight: `${minHeight}px`,
              height: '100%',
              border: '1px solid var(--gray)',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            },
            '.cm-content': {
              minHeight: `${minHeight}px`,
              fontFamily: 'var(--requester-code-font-family, monospace)',
              fontSize: 'var(--requester-code-font-size, 13px)',
              lineHeight: '1.5',
              padding: '10px'
            },
            '.cm-gutters': {
              backgroundColor: 'var(--background-dark)',
              color: 'var(--foreground-muted)',
              borderRight: '1px solid var(--gray)'
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

    view.dom.setAttribute('aria-label', ariaLabel);
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel, minHeight]);

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

  return <div className="requester-json-editor" ref={containerRef} />;
};
