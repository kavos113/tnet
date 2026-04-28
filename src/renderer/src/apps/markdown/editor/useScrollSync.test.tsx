import { type RefObject } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorView } from '@codemirror/view';
import type { PreviewPaneHandle } from '@renderer/apps/markdown/preview/PreviewPane';
import type { EditorPaneHandle } from './EditorPane';
import { useScrollSync } from './useScrollSync';

const scrollElement = ({
  scrollTop,
  scrollHeight,
  clientHeight
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): HTMLElement => {
  const element = document.createElement('div');
  element.scrollTop = scrollTop;
  Object.defineProperty(element, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(element, 'clientHeight', { value: clientHeight, configurable: true });
  return element;
};

const fakeEditorView = (
  scrollDOM: HTMLElement,
  options: {
    lineForScrollTop?: (scrollTop: number) => number;
    topForLine?: (lineNumber: number) => number;
    lines?: number;
  } = {}
): EditorView => {
  const lines = options.lines ?? 10;

  return {
    scrollDOM,
    lineBlockAtHeight: (height: number) => ({
      from: ((options.lineForScrollTop?.(height - 1) ?? 1) - 1) * 10
    }),
    lineBlockAt: (from: number) => ({
      top: options.topForLine?.(Math.floor(from / 10) + 1) ?? from * 2
    }),
    state: {
      doc: {
        lines,
        line: (lineNumber: number) => ({ from: (lineNumber - 1) * 10 }),
        lineAt: (from: number) => ({ number: Math.floor(from / 10) + 1 })
      }
    }
  } as unknown as EditorView;
};

describe('useScrollSync', () => {
  const frameCallbacks: FrameRequestCallback[] = [];
  let editorScroller: HTMLElement | null = null;
  let previewElement: HTMLElement | null = null;
  let editorViewOptions: Parameters<typeof fakeEditorView>[1] = {};

  beforeEach(() => {
    frameCallbacks.length = 0;
    editorScroller = null;
    previewElement = null;
    editorViewOptions = {};
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const TestScrollSync = (): React.JSX.Element => {
    const editorPaneRef = {
      current: {
        getScroller: () => editorScroller,
        getView: () => (editorScroller ? fakeEditorView(editorScroller, editorViewOptions) : null),
        revealLine: () => true
      }
    } as RefObject<EditorPaneHandle | null>;
    const previewPaneRef = {
      current: {
        getPreviewElement: () => previewElement
      }
    } as RefObject<PreviewPaneHandle | null>;

    useScrollSync({
      editorPaneRef,
      previewPaneRef,
      enabled: true
    });

    return <div />;
  };

  const runNextFrame = (): void => {
    act(() => {
      frameCallbacks.shift()?.(0);
    });
  };

  it('attaches scroll listeners after the editor scroller is created', () => {
    render(<TestScrollSync />);
    expect(frameCallbacks).toHaveLength(1);

    editorScroller = scrollElement({ scrollTop: 50, scrollHeight: 200, clientHeight: 100 });
    previewElement = scrollElement({ scrollTop: 0, scrollHeight: 400, clientHeight: 100 });

    runNextFrame();
    runNextFrame();

    editorScroller.dispatchEvent(new Event('scroll'));
    runNextFrame();

    expect(previewElement.scrollTop).toBe(150);
  });

  it('uses the latest source position when multiple scroll events happen in one frame', () => {
    editorScroller = scrollElement({ scrollTop: 0, scrollHeight: 200, clientHeight: 100 });
    previewElement = scrollElement({ scrollTop: 0, scrollHeight: 500, clientHeight: 100 });

    render(<TestScrollSync />);

    editorScroller.scrollTop = 25;
    editorScroller.dispatchEvent(new Event('scroll'));
    editorScroller.scrollTop = 75;
    editorScroller.dispatchEvent(new Event('scroll'));
    runNextFrame();

    expect(previewElement.scrollTop).toBe(300);
  });

  it('syncs editor scroll to the matching preview source line when anchors exist', () => {
    editorScroller = scrollElement({ scrollTop: 0, scrollHeight: 600, clientHeight: 100 });
    previewElement = scrollElement({ scrollTop: 0, scrollHeight: 800, clientHeight: 100 });
    editorViewOptions = {
      lineForScrollTop: (scrollTop) => (scrollTop >= 250 ? 3 : 1)
    };
    Object.defineProperty(previewElement, 'getBoundingClientRect', {
      value: () => ({ top: 100 })
    });

    const first = document.createElement('p');
    first.dataset.sourceLine = '1';
    Object.defineProperty(first, 'getBoundingClientRect', { value: () => ({ top: 100 }) });
    const target = document.createElement('h2');
    target.dataset.sourceLine = '3';
    Object.defineProperty(target, 'getBoundingClientRect', { value: () => ({ top: 240 }) });
    previewElement.append(first, target);

    render(<TestScrollSync />);

    editorScroller.scrollTop = 250;
    editorScroller.dispatchEvent(new Event('scroll'));
    runNextFrame();

    expect(previewElement.scrollTop).toBe(140);
  });

  it('syncs preview scroll to the matching editor source line when anchors exist', () => {
    editorScroller = scrollElement({ scrollTop: 0, scrollHeight: 600, clientHeight: 100 });
    previewElement = scrollElement({ scrollTop: 80, scrollHeight: 800, clientHeight: 100 });
    editorViewOptions = {
      topForLine: (lineNumber) => lineNumber * 75
    };
    Object.defineProperty(previewElement, 'getBoundingClientRect', {
      value: () => ({ top: 100 })
    });

    const before = document.createElement('p');
    before.dataset.sourceLine = '2';
    Object.defineProperty(before, 'getBoundingClientRect', { value: () => ({ top: 80 }) });
    const current = document.createElement('h2');
    current.dataset.sourceLine = '4';
    Object.defineProperty(current, 'getBoundingClientRect', { value: () => ({ top: 100 }) });
    const after = document.createElement('p');
    after.dataset.sourceLine = '6';
    Object.defineProperty(after, 'getBoundingClientRect', { value: () => ({ top: 130 }) });
    previewElement.append(before, current, after);

    render(<TestScrollSync />);

    previewElement.dispatchEvent(new Event('scroll'));
    runNextFrame();

    expect(editorScroller.scrollTop).toBe(300);
  });
});
