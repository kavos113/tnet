import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import {
  calculateBaseScale,
  centerPan,
  type DiagramMeasure,
  type Point,
  naturalBaseScale,
  zoomAroundPoint
} from './mermaidViewportMath';
import { serializeMermaidSvg, svgMarkupToPngBase64 } from './mermaidExport';
import { dbInspectorTnetApi } from '../dbInspectorTnetApi';
import appStyles from '../DbInspectorShared.module.css';
import styles from './MermaidDiagramView.module.css';

interface MermaidDiagramViewProps {
  source: string;
}

const MIN_ZOOM = 0.02;
const ZOOM_FACTOR = 1.2;

export const MermaidDiagramView = ({ source }: MermaidDiagramViewProps): React.JSX.Element => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    { pointerId: number; startX: number; startY: number; pan: Point } | undefined
  >(undefined);
  const [error, setError] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    const render = async (): Promise<void> => {
      try {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
        const id = `db-inspector-er-${hashMermaidSource(source)}`;
        const result = await mermaid.render(id, source);
        if (cancelled) return;
        container.innerHTML = result.svg;
        requestAnimationFrame(() => {
          const nextMeasure = measureElements(viewportRef.current, containerRef.current, 1);
          if (!nextMeasure || cancelled) return;
          setZoom(1);
          setBaseScale(naturalBaseScale());
          setPan(roundPoint(centerPan(nextMeasure, 1)));
        });
        setError(undefined);
      } catch (renderError) {
        if (cancelled) return;
        container.textContent = source;
        setError(renderError instanceof Error ? renderError.message : String(renderError));
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resizeObserver = new ResizeObserver(() => {
      const nextMeasure = measureElements(
        viewportRef.current,
        containerRef.current,
        baseScale * zoom
      );
      if (!nextMeasure) return;
      setPan(roundPoint(centerPan(nextMeasure, baseScale * zoom)));
    });
    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  }, [baseScale, zoom]);

  const measure = (): DiagramMeasure | undefined => {
    return measureElements(viewportRef.current, containerRef.current, baseScale * zoom);
  };

  const fitDiagram = (nextZoom: number): void => {
    const nextMeasure = measure();
    if (!nextMeasure) return;
    const nextBaseScale = calculateBaseScale(nextMeasure);
    const nextScale = nextBaseScale * nextZoom;
    setBaseScale(nextBaseScale);
    setPan(roundPoint(centerPan(nextMeasure, nextScale)));
  };

  const centerDiagram = (nextZoom: number): void => {
    const nextMeasure = measure();
    if (!nextMeasure) return;
    const nextBaseScale = naturalBaseScale();
    const nextScale = nextBaseScale * nextZoom;
    setBaseScale(nextBaseScale);
    setPan(roundPoint(centerPan(nextMeasure, nextScale)));
  };

  const resetDiagram = (): void => {
    setZoom(1);
    centerDiagram(1);
  };

  const currentSvgMarkup = (): string | undefined => {
    const svg = containerRef.current?.querySelector('svg');
    return svg ? serializeMermaidSvg(svg) : undefined;
  };

  const saveSvg = (): void => {
    const markup = currentSvgMarkup();
    if (!markup) {
      setExportMessage('No Mermaid SVG is available.');
      return;
    }
    void dbInspectorTnetApi.dbInspector.files
      .saveTextFile({
        defaultPath: 'er-diagram.svg',
        content: markup,
        filters: [{ name: 'SVG', extensions: ['svg'] }]
      })
      .then((result) => setExportMessage(result ? `Saved SVG: ${result.path}` : undefined))
      .catch((saveError) =>
        setExportMessage(saveError instanceof Error ? saveError.message : String(saveError))
      );
  };

  const savePng = (): void => {
    const markup = currentSvgMarkup();
    if (!markup) {
      setExportMessage('No Mermaid SVG is available.');
      return;
    }
    void svgMarkupToPngBase64(markup)
      .then((base64Content) =>
        dbInspectorTnetApi.dbInspector.files.saveBinaryFile({
          defaultPath: 'er-diagram.png',
          base64Content,
          filters: [{ name: 'PNG', extensions: ['png'] }]
        })
      )
      .then((result) => setExportMessage(result ? `Saved PNG: ${result.path}` : undefined))
      .catch((saveError) =>
        setExportMessage(saveError instanceof Error ? saveError.message : String(saveError))
      );
  };

  const updateZoom = (nextZoom: number, anchor?: Point): void => {
    const normalizedZoom = Math.max(MIN_ZOOM, Number(nextZoom.toFixed(3)));
    if (!anchor) {
      setZoom(normalizedZoom);
      return;
    }
    const currentScale = baseScale * zoom;
    const nextScale = baseScale * normalizedZoom;
    setPan(roundPoint(zoomAroundPoint({ anchor, pan, currentScale, nextScale })));
    setZoom(normalizedZoom);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    updateZoom(zoom * Math.exp(-event.deltaY * 0.001), {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      pan
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    setPan({
      x: Math.round(drag.pan.x + event.clientX - drag.startX),
      y: Math.round(drag.pan.y + event.clientY - drag.startY)
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = undefined;
      setIsDragging(false);
    }
  };

  return (
    <div className={styles.mermaidPane}>
      <div className={styles.mermaidToolbar}>
        <button
          className={appStyles.iconButton}
          type="button"
          title="Zoom out"
          onClick={() => updateZoom(zoom / ZOOM_FACTOR)}
        >
          <span className="material-symbols-rounded">remove</span>
        </button>
        <input
          className={styles.zoomInput}
          type="number"
          min={1}
          step={10}
          value={Math.round(zoom * 100)}
          aria-label="Mermaid zoom"
          onChange={(event) => updateZoom(Number(event.target.value) / 100)}
        />
        <button
          className={appStyles.iconButton}
          type="button"
          title="Zoom in"
          onClick={() => updateZoom(zoom * ZOOM_FACTOR)}
        >
          <span className="material-symbols-rounded">add</span>
        </button>
        <button className={appStyles.button} type="button" onClick={() => fitDiagram(zoom)}>
          Fit
        </button>
        <button className={appStyles.button} type="button" onClick={resetDiagram}>
          100%
        </button>
        <button className={appStyles.button} type="button" onClick={saveSvg}>
          Save SVG
        </button>
        <button className={appStyles.button} type="button" onClick={savePng}>
          Save PNG
        </button>
      </div>
      {error ? <div className={appStyles.error}>Mermaid render failed: {error}</div> : null}
      {exportMessage ? <div className={styles.exportMessage}>{exportMessage}</div> : null}
      <div
        ref={viewportRef}
        className={`${styles.mermaidViewport} ${isDragging ? styles.mermaidViewportDragging : ''}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={containerRef}
          className={styles.mermaidDiagram}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            width: `${baseScale * zoom * 100}%`
          }}
        />
      </div>
    </div>
  );
};

const hashMermaidSource = (source: string): string => {
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
};

const measureElements = (
  viewport: HTMLDivElement | null,
  container: HTMLDivElement | null,
  scale: number
): DiagramMeasure | undefined => {
  const svg = container?.querySelector('svg');
  if (!viewport || !svg) return undefined;
  const bounds = svg.getBoundingClientRect();
  const width = bounds.width / Math.max(scale, MIN_ZOOM);
  const height = bounds.height / Math.max(scale, MIN_ZOOM);
  if (!width || !height) return undefined;
  return {
    viewportWidth: viewport.clientWidth,
    viewportHeight: viewport.clientHeight,
    diagramWidth: width,
    diagramHeight: height
  };
};

const roundPoint = (point: Point): Point => ({
  x: Math.round(point.x),
  y: Math.round(point.y)
});
