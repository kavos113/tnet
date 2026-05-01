import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  type CompletionSource
} from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

interface SqlEditorProps {
  value: string;
  queryFontFamily?: string;
  queryFontSize?: number;
  minHeight: number;
  completionSource?: CompletionSource;
  onChange: (value: string) => void;
}

export const SqlEditor = ({
  completionSource,
  onChange,
  queryFontFamily,
  queryFontSize,
  minHeight,
  value
}: SqlEditorProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const completionSourceRef = useRef(completionSource);
  const initialValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    completionSourceRef.current = completionSource;
  }, [completionSource]);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          basicSetup,
          closeBrackets(),
          autocompletion({
            override: [
              (context) => {
                return completionSourceRef.current?.(context) ?? null;
              }
            ]
          }),
          keymap.of([...closeBracketsKeymap, ...completionKeymap]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            '&': {
              minHeight: `${minHeight}px`,
              height: `${minHeight}px`,
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            },
            '.cm-content': {
              minHeight: `${minHeight}px`,
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
  }, [minHeight, queryFontFamily, queryFontSize]);

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
