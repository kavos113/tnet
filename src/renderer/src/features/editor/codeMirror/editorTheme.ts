import { EditorView } from '@codemirror/view';

export const markdownEditorTheme = EditorView.theme({
  '&': {
    height: '100%'
  },
  '.cm-editor': {
    height: '100%'
  },
  '.cm-scroller': {
    fontFamily: 'var(--editor-font-family)',
    fontSize: 'var(--editor-font-size)',
    lineHeight: '1.6'
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '12px',
    caretColor: 'var(--foreground)'
  },
  '.cm-gutters': {
    display: 'none'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0, 0, 0, 0.025)'
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--foreground)',
    borderLeftWidth: '2px'
  },
  '.cm-md-heading-1': {
    fontSize: '2em',
    fontWeight: '700',
    borderBottom: '1px solid var(--gray)',
    paddingBottom: '6px'
  },
  '.cm-md-heading-2': {
    fontSize: '1.6em',
    fontWeight: '700'
  },
  '.cm-md-heading-3': {
    fontSize: '1.3em',
    fontWeight: '600'
  },
  '.cm-md-bold': {
    fontWeight: '700'
  },
  '.cm-md-italic': {
    fontStyle: 'italic'
  },
  '.cm-md-inline-code, .cm-md-fenced-code': {
    backgroundColor: 'rgba(0, 0, 0, 0.045)',
    fontFamily: '"Migu 1M", Consolas, Monaco, monospace'
  },
  '.cm-md-blockquote': {
    borderLeft: '3px solid var(--main-dark)',
    paddingLeft: '12px',
    color: '#666'
  },
  '.cm-md-link': {
    color: 'var(--main-dark)',
    textDecoration: 'underline'
  },
  '.cm-md-syntax-mark, .cm-md-link-url': {
    color: '#999'
  },
  '.cm-md-strikethrough': {
    textDecoration: 'line-through',
    opacity: '0.65'
  },
  '.cm-tooltip-autocomplete': {
    fontSize: '12px'
  }
});
