import { syntaxTree } from '@codemirror/language';
import type { Range } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate
} from '@codemirror/view';

export const buildDecorations = (view: EditorView): DecorationSet => {
  const decorations: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        if (/^ATXHeading[1-6]$/.test(node.name)) {
          const level = Number(node.name.slice(-1));
          decorations.push(
            Decoration.line({ class: `cm-md-heading cm-md-heading-${level}` }).range(
              view.state.doc.lineAt(node.from).from
            )
          );
          return;
        }

        if (
          node.name === 'HeaderMark' ||
          node.name === 'EmphasisMark' ||
          node.name === 'QuoteMark'
        ) {
          decorations.push(
            Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to)
          );
        } else if (node.name === 'StrongEmphasis') {
          decorations.push(Decoration.mark({ class: 'cm-md-bold' }).range(node.from, node.to));
        } else if (node.name === 'Emphasis') {
          decorations.push(Decoration.mark({ class: 'cm-md-italic' }).range(node.from, node.to));
        } else if (node.name === 'InlineCode') {
          decorations.push(
            Decoration.mark({ class: 'cm-md-inline-code' }).range(node.from, node.to)
          );
        } else if (node.name === 'FencedCode' || node.name === 'Blockquote') {
          const className = node.name === 'FencedCode' ? 'cm-md-fenced-code' : 'cm-md-blockquote';
          const start = view.state.doc.lineAt(node.from);
          const end = view.state.doc.lineAt(node.to);
          for (let lineNo = start.number; lineNo <= end.number; lineNo += 1) {
            decorations.push(
              Decoration.line({ class: className }).range(view.state.doc.line(lineNo).from)
            );
          }
        } else if (node.name === 'Link') {
          decorations.push(Decoration.mark({ class: 'cm-md-link' }).range(node.from, node.to));
        } else if (node.name === 'URL') {
          decorations.push(Decoration.mark({ class: 'cm-md-link-url' }).range(node.from, node.to));
        } else if (node.name === 'Strikethrough') {
          decorations.push(
            Decoration.mark({ class: 'cm-md-strikethrough' }).range(node.from, node.to)
          );
        }
      }
    });
  }

  const docText = view.state.doc.toString();
  const mathRegex = /\$\$([\s\S]+?)\$\$|(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;
  let match: RegExpExecArray | null;
  while ((match = mathRegex.exec(docText)) !== null) {
    decorations.push(
      Decoration.mark({ class: 'cm-md-inline-math' }).range(
        match.index,
        match.index + match[0].length
      )
    );
  }

  return Decoration.set(decorations, true);
};

export const markdownDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
);
