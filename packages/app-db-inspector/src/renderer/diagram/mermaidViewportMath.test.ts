import { describe, expect, it } from 'vitest';
import {
  calculateBaseScale,
  centerPan,
  naturalBaseScale,
  zoomAroundPoint
} from './mermaidViewportMath';

describe('mermaidViewportMath', () => {
  it('uses the rendered Mermaid SVG size as the natural 100% scale', () => {
    expect(naturalBaseScale()).toBe(1);
  });

  it('keeps natural size as 100% when the diagram is smaller than the viewport', () => {
    expect(
      calculateBaseScale({
        viewportWidth: 1000,
        viewportHeight: 800,
        diagramWidth: 500,
        diagramHeight: 300
      })
    ).toBe(1);
  });

  it('fits oversized diagrams at 100%', () => {
    expect(
      calculateBaseScale({
        viewportWidth: 1000,
        viewportHeight: 800,
        diagramWidth: 2000,
        diagramHeight: 400
      })
    ).toBe(0.5);
  });

  it('centers the diagram for the current scale', () => {
    expect(
      centerPan(
        {
          viewportWidth: 1000,
          viewportHeight: 800,
          diagramWidth: 500,
          diagramHeight: 300
        },
        1
      )
    ).toEqual({ x: 250, y: 250 });
  });

  it('keeps the anchored cursor position stable while zooming', () => {
    const anchor = { x: 400, y: 300 };
    const currentPan = { x: 100, y: 50 };
    const nextPan = zoomAroundPoint({
      anchor,
      pan: currentPan,
      currentScale: 1,
      nextScale: 2
    });

    const diagramPointBefore = {
      x: (anchor.x - currentPan.x) / 1,
      y: (anchor.y - currentPan.y) / 1
    };
    const diagramPointAfter = {
      x: (anchor.x - nextPan.x) / 2,
      y: (anchor.y - nextPan.y) / 2
    };

    expect(diagramPointAfter).toEqual(diagramPointBefore);
  });
});
