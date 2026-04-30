import type { Extension, Range } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate
} from '@codemirror/view';

const addLineDecorations = (
  decorations: Range<Decoration>[],
  view: EditorView,
  from: number,
  to: number,
  className: string
): void => {
  const start = view.state.doc.lineAt(from);
  const end = view.state.doc.lineAt(to);
  for (let lineNo = start.number; lineNo <= end.number; lineNo += 1) {
    decorations.push(Decoration.line({ class: className }).range(view.state.doc.line(lineNo).from));
  }
};

const buildKeywordDecorations = (view: EditorView): DecorationSet => {
  const decorations: Range<Decoration>[] = [];
  const keywordRegex = /<keyword\b[^>]*>[\s\S]*?<\/keyword>/g;
  const docText = view.state.doc.toString();
  let keywordMatch: RegExpExecArray | null;
  while ((keywordMatch = keywordRegex.exec(docText)) !== null) {
    const from = keywordMatch.index;
    const to = from + keywordMatch[0].length;
    addLineDecorations(decorations, view, from, to, 'cm-md-keyword-block-line');
    decorations.push(Decoration.mark({ class: 'cm-md-keyword-block' }).range(from, to));
  }
  return Decoration.set(decorations, true);
};

const keywordDecorationTheme = EditorView.theme({
  '.cm-md-keyword-block-line': {
    background: 'rgba(250, 204, 21, 0.08)'
  },
  '.cm-md-keyword-block': {
    color: '#92400e'
  },
  '&.cm-focused .cm-md-keyword-block': {
    color: '#78350f'
  }
});

export const keywordDecorationPlugin = (): Extension => [
  keywordDecorationTheme,
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildKeywordDecorations(view);
      }

      update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildKeywordDecorations(update.view);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations
    }
  )
];
