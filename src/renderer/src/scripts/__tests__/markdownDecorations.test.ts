import { describe, it, expect, afterEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { isCursorOnLine, buildDecorations, markdownDecorationPlugin } from '../markdownDecorations';

/**
 * テスト用の EditorView を作成する
 */
function createEditorView(doc: string, cursorPos = 0): EditorView {
  const state = EditorState.create({
    doc,
    extensions: [
      markdown({ base: markdownLanguage }),
      markdownDecorationPlugin,
      EditorView.lineWrapping
    ],
    selection: { anchor: cursorPos, head: cursorPos }
  });
  const container = document.createElement('div');
  document.body.appendChild(container);
  return new EditorView({ state, parent: container });
}

describe('markdownDecorations', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      const parent = view.dom.parentElement;
      view.destroy();
      parent?.remove();
    }
  });

  describe('isCursorOnLine', () => {
    it('カーソルが同じ行にある場合 true を返す', () => {
      view = createEditorView('line1\nline2\nline3', 0);
      expect(isCursorOnLine(view, 0)).toBe(true);
      expect(isCursorOnLine(view, 3)).toBe(true);
    });

    it('カーソルが異なる行にある場合 false を返す', () => {
      view = createEditorView('line1\nline2\nline3', 0);
      expect(isCursorOnLine(view, 6)).toBe(false);
      expect(isCursorOnLine(view, 12)).toBe(false);
    });

    it('カーソルが2行目にある場合、2行目の位置で true を返す', () => {
      view = createEditorView('line1\nline2\nline3', 7);
      expect(isCursorOnLine(view, 6)).toBe(true);
      expect(isCursorOnLine(view, 10)).toBe(true);
      expect(isCursorOnLine(view, 0)).toBe(false);
    });

    it('選択範囲が複数行にまたがる場合、範囲内の行で true を返す', () => {
      const state = EditorState.create({
        doc: 'line1\nline2\nline3',
        extensions: [markdown({ base: markdownLanguage })],
        selection: { anchor: 2, head: 8 }
      });
      const container = document.createElement('div');
      document.body.appendChild(container);
      view = new EditorView({ state, parent: container });

      // 1行目（選択開始行）
      expect(isCursorOnLine(view, 0)).toBe(true);
      // 2行目（選択終了行）
      expect(isCursorOnLine(view, 6)).toBe(true);
      // 3行目（選択範囲外）
      expect(isCursorOnLine(view, 12)).toBe(false);
    });
  });

  describe('buildDecorations', () => {
    it('空ドキュメントでもエラーにならない', () => {
      view = createEditorView('');
      const decos = buildDecorations(view);
      expect(decos).toBeDefined();
    });

    it('Markdown 構文なしのテキストではデコレーションが空', () => {
      view = createEditorView('Just plain text');
      const decos = buildDecorations(view);
      // RangeSet の iter で走査して確認
      const iter = decos.iter();
      // plain text にはデコレーションなし
      expect(iter.value).toBeNull();
    });

    it('見出しに対してラインデコレーションを生成する', () => {
      // カーソルを見出し以外の行に置く
      view = createEditorView('# Heading 1\n\nSome text', 14);

      const decos = buildDecorations(view);
      const collected: { from: number; to: number }[] = [];
      const iter = decos.iter();
      while (iter.value) {
        collected.push({ from: iter.from, to: iter.to });
        iter.next();
      }
      // 見出し行に関連するデコレーションが存在する
      expect(collected.length).toBeGreaterThan(0);
      // 最初のデコレーションは行の先頭（見出しラインデコレーション or HeaderMark のスタイル）
      expect(collected[0].from).toBe(0);
    });

    it('太字テキストに対してデコレーションを生成する', () => {
      view = createEditorView('**bold** text', 10);
      const decos = buildDecorations(view);
      const collected: { from: number; to: number }[] = [];
      const iter = decos.iter();
      while (iter.value) {
        collected.push({ from: iter.from, to: iter.to });
        iter.next();
      }
      // 太字に関連するデコレーションが存在する
      expect(collected.length).toBeGreaterThan(0);
    });
  });

  describe('markdownDecorationPlugin', () => {
    it('プラグインがエディタに正常に組み込まれる', () => {
      view = createEditorView('# Hello\n\n**bold** and *italic*');
      expect(view).toBeDefined();
      expect(view.state.doc.toString()).toBe('# Hello\n\n**bold** and *italic*');
    });

    it('ドキュメント変更後もプラグインがエラーにならない', () => {
      view = createEditorView('# Hello');
      view.dispatch({
        changes: { from: 7, to: 7, insert: '\n\nNew content with **bold**' }
      });
      expect(view.state.doc.toString()).toBe('# Hello\n\nNew content with **bold**');
    });

    it('カーソル移動後もプラグインがエラーにならない', () => {
      view = createEditorView('# Hello\n\nSome text', 0);
      view.dispatch({
        selection: { anchor: 10, head: 10 }
      });
      expect(view.state.selection.main.head).toBe(10);
    });

    it('コードブロックを含むドキュメントでエラーにならない', () => {
      const doc = '# Title\n\n```javascript\nconsole.log("hello");\n```\n\nText';
      view = createEditorView(doc);
      expect(view.state.doc.toString()).toBe(doc);
    });

    it('引用ブロックを含むドキュメントでエラーにならない', () => {
      const doc = '> This is a quote\n> Second line\n\nNormal text';
      view = createEditorView(doc);
      expect(view.state.doc.toString()).toBe(doc);
    });

    it('リンクを含むドキュメントでエラーにならない', () => {
      const doc = 'Check [this link](https://example.com) here';
      view = createEditorView(doc);
      expect(view.state.doc.toString()).toBe(doc);
    });

    it('水平線を含むドキュメントでエラーにならない', () => {
      const doc = 'Above\n\n---\n\nBelow';
      view = createEditorView(doc);
      expect(view.state.doc.toString()).toBe(doc);
    });

    it('複雑な Markdown ドキュメントでエラーにならない', () => {
      const doc = [
        '# Heading 1',
        '',
        '## Heading 2',
        '',
        'Normal text with **bold** and *italic* and ~~strikethrough~~.',
        '',
        '> Blockquote with **bold**',
        '',
        '```typescript',
        'const x = 1;',
        '```',
        '',
        '---',
        '',
        '- List item 1',
        '- List item 2',
        '',
        '[Link](https://example.com)',
        '',
        '`inline code`'
      ].join('\n');
      view = createEditorView(doc, 0);
      expect(view.state.doc.toString()).toBe(doc);

      // カーソルを移動しても問題ない
      for (let pos = 0; pos < Math.min(doc.length, 50); pos += 10) {
        view.dispatch({ selection: { anchor: pos, head: pos } });
      }
    });

    it('インライン数式 $...$ を含むドキュメントでデコレーションが生成される', () => {
      const doc = 'The formula $x^2 + y^2 = z^2$ is famous.';
      view = createEditorView(doc, 0);

      const decos = buildDecorations(view);
      const collected: { from: number; to: number }[] = [];
      const iter = decos.iter();
      while (iter.value) {
        collected.push({ from: iter.from, to: iter.to });
        iter.next();
      }
      // インライン数式のデコレーション（マークデコレーション）が存在する
      expect(collected.length).toBeGreaterThan(0);
      // $x^2 + y^2 = z^2$ の範囲を含むマークデコレーションが存在する
      const dollarStart = doc.indexOf('$');
      const dollarEnd = doc.indexOf('$', dollarStart + 1) + 1;
      const mathDeco = collected.find((d) => d.from === dollarStart && d.to === dollarEnd);
      expect(mathDeco).toBeDefined();
    });

    it('ディスプレイ数式 $$...$$ を含むドキュメントでデコレーションが生成される', () => {
      const doc = 'Text\n\n$$\nx = \\frac{-b}{2a}\n$$\n\nMore text';
      view = createEditorView(doc, 0);

      const decos = buildDecorations(view);
      const collected: { from: number; to: number }[] = [];
      const iter = decos.iter();
      while (iter.value) {
        collected.push({ from: iter.from, to: iter.to });
        iter.next();
      }
      // ディスプレイ数式のラインデコレーションが存在する
      expect(collected.length).toBeGreaterThan(0);
    });

    it('$$ はインライン数式としてマッチしない', () => {
      const doc = '$$x^2$$';
      view = createEditorView(doc, 0);

      const decos = buildDecorations(view);
      const collected: { from: number; to: number }[] = [];
      const iter = decos.iter();
      while (iter.value) {
        collected.push({ from: iter.from, to: iter.to });
        iter.next();
      }
      // display math のラインデコレーションのみ（inline math は 0 件）
      expect(collected.length).toBeGreaterThan(0);
      // インラインマークが存在しないことを確認（全てラインデコレーション = from === to）
      const markDecos = collected.filter((d) => d.from !== d.to);
      expect(markDecos.length).toBe(0);
    });
  });
});
