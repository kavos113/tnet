import { describe, expect, it } from 'vitest';
import { getEditorPanePercent } from './splitPaneResize';

describe('split pane resize', () => {
  it('calculates editor width as a percentage of the split container', () => {
    expect(getEditorPanePercent({ clientX: 350, containerLeft: 100, containerWidth: 500 })).toBe(
      50
    );
  });

  it('clamps editor width to the legacy 20-80 percent range', () => {
    expect(getEditorPanePercent({ clientX: 0, containerLeft: 100, containerWidth: 500 })).toBe(20);
    expect(getEditorPanePercent({ clientX: 700, containerLeft: 100, containerWidth: 500 })).toBe(
      80
    );
  });
});
