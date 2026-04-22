import { syntaxTree } from '@codemirror/language';
import type { Range } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  type EditorView,
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
          addLineDecorations(decorations, view, node.from, node.to, className);
          if (node.name === 'FencedCode') {
            decorations.push(
              Decoration.mark({ class: 'cm-md-code-block' }).range(node.from, node.to)
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

  const keywordRegex = /<keyword\b[^>]*>[\s\S]*?<\/keyword>/g;
  let keywordMatch: RegExpExecArray | null;
  while ((keywordMatch = keywordRegex.exec(docText)) !== null) {
    const from = keywordMatch.index;
    const to = from + keywordMatch[0].length;
    addLineDecorations(decorations, view, from, to, 'cm-md-keyword-block-line');
    decorations.push(Decoration.mark({ class: 'cm-md-keyword-block' }).range(from, to));
  }

  const displayMathRegex = /\$\$([\s\S]+?)\$\$/g;
  let displayMatch: RegExpExecArray | null;
  while ((displayMatch = displayMathRegex.exec(docText)) !== null) {
    const startLine = view.state.doc.lineAt(displayMatch.index);
    const endLine = view.state.doc.lineAt(displayMatch.index + displayMatch[0].length);
    for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo += 1) {
      decorations.push(
        Decoration.line({ class: 'cm-md-display-math' }).range(view.state.doc.line(lineNo).from)
      );
    }
  }

  const inlineMathRegex = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = inlineMathRegex.exec(docText)) !== null) {
    decorations.push(
      Decoration.mark({ class: 'cm-md-inline-math' }).range(
        inlineMatch.index,
        inlineMatch.index + inlineMatch[0].length
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
