import type { EditorView } from '@codemirror/view';

export const getScrollRatio = (element: HTMLElement): number => {
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 0) return 0;
  return element.scrollTop / maxScrollTop;
};

export const applyScrollRatio = (element: HTMLElement, ratio: number): void => {
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  element.scrollTop = maxScrollTop <= 0 ? 0 : maxScrollTop * ratio;
};

export const getEditorTopLine = (view: EditorView): number => {
  const block = view.lineBlockAtHeight(view.scrollDOM.scrollTop + 1);
  return view.state.doc.lineAt(block.from).number;
};

export const scrollEditorToLine = (view: EditorView, lineNumber: number): void => {
  const clampedLine = Math.min(Math.max(1, lineNumber), view.state.doc.lines);
  const line = view.state.doc.line(clampedLine);
  const block = view.lineBlockAt(line.from);
  view.scrollDOM.scrollTop = block.top;
};

const sourceLineElements = (
  container: HTMLElement
): Array<{ element: HTMLElement; line: number }> =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-source-line]'))
    .map((element) => ({
      element,
      line: Number(element.dataset.sourceLine)
    }))
    .filter((item) => Number.isFinite(item.line));

export const findPreviewElementForSourceLine = (
  container: HTMLElement,
  sourceLine: number
): HTMLElement | null => {
  const elements = sourceLineElements(container);
  if (elements.length === 0) return null;

  let candidate = elements[0];
  for (const item of elements) {
    if (item.line > sourceLine) break;
    candidate = item;
  }
  return candidate.element;
};

export const getSourceLineAtPreviewTop = (container: HTMLElement): number | null => {
  const elements = sourceLineElements(container);
  if (elements.length === 0) return null;

  const containerTop = container.getBoundingClientRect().top;
  let candidate = elements[0];
  for (const item of elements) {
    const top = item.element.getBoundingClientRect().top;
    if (top - containerTop > 4) break;
    candidate = item;
  }
  return candidate.line;
};

export const scrollPreviewToElement = (container: HTMLElement, element: HTMLElement): void => {
  const containerTop = container.getBoundingClientRect().top;
  const elementTop = element.getBoundingClientRect().top;
  container.scrollTop += elementTop - containerTop;
};
