import { describe, expect, it } from 'vitest';
import {
  applyScrollRatio,
  findPreviewElementForSourceLine,
  getScrollRatio,
  getSourceLineAtPreviewTop,
  scrollPreviewToElement
} from './scrollSync';

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

  it('finds the closest preview source line at or before the editor line', () => {
    const container = document.createElement('div');
    const first = document.createElement('p');
    first.dataset.sourceLine = '2';
    const second = document.createElement('h2');
    second.dataset.sourceLine = '8';
    const third = document.createElement('p');
    third.dataset.sourceLine = '12';
    container.append(first, second, third);

    expect(findPreviewElementForSourceLine(container, 10)).toBe(second);
  });

  it('returns the source line represented at the preview top edge', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ top: 100 })
    });
    const before = document.createElement('p');
    before.dataset.sourceLine = '2';
    Object.defineProperty(before, 'getBoundingClientRect', { value: () => ({ top: 80 }) });
    const current = document.createElement('h2');
    current.dataset.sourceLine = '6';
    Object.defineProperty(current, 'getBoundingClientRect', { value: () => ({ top: 103 }) });
    const after = document.createElement('p');
    after.dataset.sourceLine = '10';
    Object.defineProperty(after, 'getBoundingClientRect', { value: () => ({ top: 130 }) });
    container.append(before, current, after);

    expect(getSourceLineAtPreviewTop(container)).toBe(6);
  });

  it('scrolls the preview so the source element reaches the top edge', () => {
    const container = scrollElement({ scrollTop: 50, scrollHeight: 400, clientHeight: 100 });
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ top: 100 })
    });
    const target = document.createElement('h2');
    Object.defineProperty(target, 'getBoundingClientRect', {
      value: () => ({ top: 180 })
    });

    scrollPreviewToElement(container, target);

    expect(container.scrollTop).toBe(130);
  });
});
