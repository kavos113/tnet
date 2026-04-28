import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it } from 'vitest';
import { buildDecorations } from './markdownDecorations';

interface CollectedDecoration {
  from: number;
  to: number;
  className?: string;
}

const createEditorView = (doc: string): EditorView => {
  const parent = document.createElement('div');
  document.body.appendChild(parent);

  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [markdown({ base: markdownLanguage })]
    })
  });
};

const collectDecorations = (view: EditorView): CollectedDecoration[] => {
  const decorations = buildDecorations(view);
  const collected: CollectedDecoration[] = [];
  const iter = decorations.iter();

  while (iter.value) {
    collected.push({
      from: iter.from,
      to: iter.to,
      className: (iter.value.spec as { class?: string }).class
    });
    iter.next();
  }

  return collected;
};

describe('markdownDecorations', () => {
  let view: EditorView | undefined;

  afterEach(() => {
    const parent = view?.dom.parentElement;
    view?.destroy();
    parent?.remove();
    view = undefined;
  });

  it('marks inline LaTeX so the editor theme can render it in a monospace font', () => {
    const doc = 'Euler identity $e^{i\\pi} + 1 = 0$ is compact.';
    view = createEditorView(doc);

    const mathStart = doc.indexOf('$');
    const mathEnd = doc.indexOf('$', mathStart + 1) + 1;

    expect(collectDecorations(view)).toContainEqual({
      from: mathStart,
      to: mathEnd,
      className: 'cm-md-inline-math'
    });
  });

  it('marks every display LaTeX line with the legacy display math class', () => {
    const doc = ['before', '$$', 'x = \\frac{-b}{2a}', '$$', 'after'].join('\n');
    view = createEditorView(doc);

    const lines = [2, 3, 4].map((lineNo) => view?.state.doc.line(lineNo).from);

    for (const lineStart of lines) {
      expect(collectDecorations(view)).toContainEqual({
        from: lineStart,
        to: lineStart,
        className: 'cm-md-display-math'
      });
    }
  });

  it('does not mark display LaTeX as inline math', () => {
    const doc = '$$x^2$$';
    view = createEditorView(doc);

    expect(
      collectDecorations(view).some((decoration) => decoration.className === 'cm-md-inline-math')
    ).toBe(false);
  });

  it('highlights keyword blocks across their full editor range and lines', () => {
    const doc = ['before', '<keyword name="Definition">', 'Body', '</keyword>', 'after'].join('\n');
    view = createEditorView(doc);

    const keywordStart = doc.indexOf('<keyword');
    const keywordEnd = doc.indexOf('</keyword>') + '</keyword>'.length;
    const decorations = collectDecorations(view);

    expect(decorations).toContainEqual({
      from: keywordStart,
      to: keywordEnd,
      className: 'cm-md-keyword-block'
    });

    for (const lineNo of [2, 3, 4]) {
      const lineStart = view.state.doc.line(lineNo).from;
      expect(decorations).toContainEqual({
        from: lineStart,
        to: lineStart,
        className: 'cm-md-keyword-block-line'
      });
    }
  });

  it('highlights fenced code blocks as both lines and an editor range', () => {
    const doc = ['before', '```ts', 'const x = 1;', '```', 'after'].join('\n');
    view = createEditorView(doc);

    const codeStart = doc.indexOf('```ts');
    const codeEnd = doc.indexOf('```', codeStart + 1) + '```'.length;
    const decorations = collectDecorations(view);

    expect(decorations).toContainEqual({
      from: codeStart,
      to: codeEnd,
      className: 'cm-md-code-block'
    });

    for (const lineNo of [2, 3, 4]) {
      const lineStart = view.state.doc.line(lineNo).from;
      expect(decorations).toContainEqual({
        from: lineStart,
        to: lineStart,
        className: 'cm-md-fenced-code'
      });
    }
  });

  it('limits regex-based decorations to the visible area for large documents', () => {
    const doc = [
      'visible line with $x$',
      ...Array.from({ length: 2000 }, () => 'filler'),
      '$far$'
    ].join('\n');
    view = createEditorView(doc);
    const firstLine = view.state.doc.line(1);
    Object.defineProperty(view, 'visibleRanges', {
      configurable: true,
      value: [{ from: firstLine.from, to: firstLine.to }]
    });

    const decorations = buildDecorations(view, { largeDocument: true });
    const collected: CollectedDecoration[] = [];
    const iter = decorations.iter();

    while (iter.value) {
      collected.push({
        from: iter.from,
        to: iter.to,
        className: (iter.value.spec as { class?: string }).class
      });
      iter.next();
    }

    expect(collected).toContainEqual({
      from: doc.indexOf('$x$'),
      to: doc.indexOf('$x$') + '$x$'.length,
      className: 'cm-md-inline-math'
    });
    expect(
      collected.some(
        (decoration) =>
          decoration.from === doc.indexOf('$far$') && decoration.className === 'cm-md-inline-math'
      )
    ).toBe(false);
  });
});
