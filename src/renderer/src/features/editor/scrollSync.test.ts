import { describe, expect, it } from 'vitest';
import { applyScrollRatio, getScrollRatio } from './scrollSync';

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

describe('scrollSync', () => {
  it('computes scroll progress from the source element', () => {
    const element = scrollElement({ scrollTop: 150, scrollHeight: 500, clientHeight: 200 });

    expect(getScrollRatio(element)).toBe(0.5);
  });

  it('maps scroll progress to the target element range', () => {
    const element = scrollElement({ scrollTop: 0, scrollHeight: 900, clientHeight: 300 });

    applyScrollRatio(element, 0.25);

    expect(element.scrollTop).toBe(150);
  });

  it('handles elements that cannot scroll', () => {
    const element = scrollElement({ scrollTop: 50, scrollHeight: 200, clientHeight: 200 });

    expect(getScrollRatio(element)).toBe(0);

    applyScrollRatio(element, 0.5);
    expect(element.scrollTop).toBe(0);
  });
});
