export interface Point {
  x: number;
  y: number;
}

export interface DiagramMeasure {
  viewportWidth: number;
  viewportHeight: number;
  diagramWidth: number;
  diagramHeight: number;
}

export const calculateBaseScale = (measure: DiagramMeasure): number => {
  const fitScale = Math.min(
    measure.viewportWidth / measure.diagramWidth,
    measure.viewportHeight / measure.diagramHeight
  );
  return Math.min(1, fitScale);
};

export const naturalBaseScale = (): number => 1;

export const centerPan = (measure: DiagramMeasure, scale: number): Point => ({
  x: (measure.viewportWidth - measure.diagramWidth * scale) / 2,
  y: (measure.viewportHeight - measure.diagramHeight * scale) / 2
});

export const zoomAroundPoint = (input: {
  anchor: Point;
  pan: Point;
  currentScale: number;
  nextScale: number;
}): Point => {
  const diagramPoint = {
    x: (input.anchor.x - input.pan.x) / input.currentScale,
    y: (input.anchor.y - input.pan.y) / input.currentScale
  };
  return {
    x: input.anchor.x - diagramPoint.x * input.nextScale,
    y: input.anchor.y - diagramPoint.y * input.nextScale
  };
};
