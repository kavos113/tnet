import { type RefObject } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PreviewPaneHandle } from '@renderer/features/preview/PreviewPane';
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

describe('useScrollSync', () => {
  const frameCallbacks: FrameRequestCallback[] = [];
  let editorScroller: HTMLElement | null = null;
  let previewElement: HTMLElement | null = null;

  beforeEach(() => {
    frameCallbacks.length = 0;
    editorScroller = null;
    previewElement = null;
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
        getScroller: () => editorScroller
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
});
