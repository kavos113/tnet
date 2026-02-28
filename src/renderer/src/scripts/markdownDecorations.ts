import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

/**
 * カーソルが指定位置の行にあるかどうかを判定する
 */
export function isCursorOnLine(view: EditorView, pos: number): boolean {
  const posLine = view.state.doc.lineAt(pos).number;
  for (const range of view.state.selection.ranges) {
    const fromLine = view.state.doc.lineAt(range.from).number;
    const toLine = view.state.doc.lineAt(range.to).number;
    if (posLine >= fromLine && posLine <= toLine) return true;
  }
  return false;
}

/**
 * 構文木を走査してデコレーションを構築する
 * 構文マークは非表示にせず、常に表示したままスタイルのみ適用する
 */
export function buildDecorations(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        switch (node.name) {
          // 見出し（H1〜H6）にラインデコレーションを付与
          case 'ATXHeading1':
          case 'ATXHeading2':
          case 'ATXHeading3':
          case 'ATXHeading4':
          case 'ATXHeading5':
          case 'ATXHeading6': {
            const level = parseInt(node.name.slice(-1));
            const line = view.state.doc.lineAt(node.from);
            decos.push(
              Decoration.line({
                class: `cm-md-heading cm-md-heading-${level}`
              }).range(line.from)
            );
            break;
          }

          // 見出しマーク（#）にスタイルを付与
          case 'HeaderMark': {
            decos.push(Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to));
            break;
          }

          // 太字
          case 'StrongEmphasis': {
            decos.push(Decoration.mark({ class: 'cm-md-bold' }).range(node.from, node.to));
            break;
          }

          // 斜体
          case 'Emphasis': {
            decos.push(Decoration.mark({ class: 'cm-md-italic' }).range(node.from, node.to));
            break;
          }

          // 強調マーク（* / ** / _ / __）にスタイルを付与
          case 'EmphasisMark': {
            decos.push(Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to));
            break;
          }

          // インラインコード
          case 'InlineCode': {
            decos.push(Decoration.mark({ class: 'cm-md-inline-code' }).range(node.from, node.to));
            break;
          }

          // コードマーク（`）にスタイルを付与
          case 'CodeMark': {
            // FencedCode 内の CodeMark（``` や言語指定行）は除外
            const parent = node.node.parent;
            if (parent && parent.name === 'FencedCode') break;

            decos.push(Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to));
            break;
          }

          // コードブロック
          case 'FencedCode': {
            const startLine = view.state.doc.lineAt(node.from);
            const endLine = view.state.doc.lineAt(node.to);
            for (let i = startLine.number; i <= endLine.number; i++) {
              const line = view.state.doc.line(i);
              decos.push(Decoration.line({ class: 'cm-md-fenced-code' }).range(line.from));
            }
            break;
          }

          // 引用ブロック
          case 'Blockquote': {
            const startLine = view.state.doc.lineAt(node.from);
            const endLine = view.state.doc.lineAt(node.to);
            for (let i = startLine.number; i <= endLine.number; i++) {
              const line = view.state.doc.line(i);
              decos.push(Decoration.line({ class: 'cm-md-blockquote' }).range(line.from));
            }
            break;
          }

          // 引用マーク（>）にスタイルを付与
          case 'QuoteMark': {
            decos.push(Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to));
            break;
          }

          // 水平線
          case 'HorizontalRule': {
            const hrLine = view.state.doc.lineAt(node.from);
            decos.push(Decoration.line({ class: 'cm-md-hr' }).range(hrLine.from));
            break;
          }

          // リンク
          case 'Link': {
            decos.push(Decoration.mark({ class: 'cm-md-link' }).range(node.from, node.to));
            break;
          }

          // リンクのマーク（[ ] ( )）にスタイルを付与
          case 'LinkMark': {
            decos.push(Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to));
            break;
          }

          // URL にスタイルを付与
          case 'URL': {
            decos.push(Decoration.mark({ class: 'cm-md-link-url' }).range(node.from, node.to));
            break;
          }

          // 取り消し線
          case 'Strikethrough': {
            decos.push(Decoration.mark({ class: 'cm-md-strikethrough' }).range(node.from, node.to));
            break;
          }

          // 取り消し線マーク（~~）にスタイルを付与
          case 'StrikethroughMark': {
            decos.push(Decoration.mark({ class: 'cm-md-syntax-mark' }).range(node.from, node.to));
            break;
          }
        }
      }
    });
  }

  return Decoration.set(decos, true);
}

/**
 * Markdown デコレーションを提供する ViewPlugin
 * 構文マークは常に表示したまま、見た目のスタイリングのみ適用する
 */
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
    decorations: (v) => v.decorations
  }
);
