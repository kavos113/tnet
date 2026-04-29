import { describe, expect, it } from 'vitest';
import { getPaperListPanePercent } from './paperPaneResize';

describe('paper pane resize', () => {
  it('calculates list width as a percentage of the paper app container', () => {
    expect(getPaperListPanePercent({ clientX: 300, containerLeft: 100, containerWidth: 500 })).toBe(
      40
    );
  });

  it('clamps list width to the compact paper layout range', () => {
    expect(getPaperListPanePercent({ clientX: 0, containerLeft: 100, containerWidth: 500 })).toBe(
      25
    );
    expect(getPaperListPanePercent({ clientX: 700, containerLeft: 100, containerWidth: 500 })).toBe(
      75
    );
  });
});
