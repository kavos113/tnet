import { useEffect, useRef, useState } from 'react';
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type RenderTask
} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import sharedStyles from '../PapersShared.module.css';
import buttonStyles from '../PapersButtons.module.css';
import { papersTnetApi } from '../papersTnetApi';
import {
  getPdfRenderScale,
  groupPdfPages,
  pdfSpreadGapPx,
  type PdfViewMode,
  type PdfZoomMode
} from './pdfViewerLayout';
import pageStyles from './PdfPageCanvas.module.css';
import styles from './PdfViewer.module.css';

interface PdfViewerProps {
  libraryRoot: string;
  pdfPath?: string;
}

interface ViewportSize {
  width: number;
  height: number;
}

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const getElementSize = (element: HTMLElement): ViewportSize => ({
  width: element.clientWidth,
  height: element.clientHeight
});

interface PdfPageCanvasProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  zoom: PdfZoomMode;
  viewportSize: ViewportSize;
  pagesInRow: number;
}

const PdfPageCanvas = ({
  pdfDocument,
  pageNumber,
  zoom,
  viewportSize,
  pagesInRow
}: PdfPageCanvasProps): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [error, setError] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    let canceled = false;

    const renderPage = async (): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsRendering(true);
      setError('');
      renderTaskRef.current?.cancel();

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (canceled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = getPdfRenderScale({
          zoom,
          pageWidth: baseViewport.width,
          pageHeight: baseViewport.height,
          viewportWidth: Math.max(viewportSize.width, 1),
          viewportHeight: Math.max(viewportSize.height, 1),
          pagesInRow,
          gapPx: pdfSpreadGapPx
        });
        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D context is not available.');

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0]
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (renderError) {
        if (
          !canceled &&
          !(renderError instanceof Error && renderError.name === 'RenderingCancelledException')
        ) {
          console.error('Failed to render PDF page', renderError);
          setError('Failed to render PDF page.');
        }
      } finally {
        if (!canceled) setIsRendering(false);
      }
    };

    void renderPage();

    return () => {
      canceled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pageNumber, pagesInRow, pdfDocument, viewportSize.height, viewportSize.width, zoom]);

  return (
    <figure className={pageStyles.page} aria-label={`PDF page ${pageNumber}`}>
      <canvas
        ref={canvasRef}
        className={pageStyles.canvas}
        aria-label={`PDF page ${pageNumber} canvas`}
      />
      {isRendering ? <div className={pageStyles.renderingState}>Rendering page...</div> : null}
      {error ? <div className={pageStyles.pageError}>{error}</div> : null}
    </figure>
  );
};

export const PdfViewer = ({ libraryRoot, pdfPath }: PdfViewerProps): React.JSX.Element => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState<PdfZoomMode>('page-width');
  const [viewMode, setViewMode] = useState<PdfViewMode>('single');
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });

  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) return;

    setViewportSize(getElementSize(viewportElement));

    if (!('ResizeObserver' in window)) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });
    resizeObserver.observe(viewportElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    let loadedDocument: PDFDocumentProxy | null = null;
    const loadingTaskRef = { current: null as PDFDocumentLoadingTask | null };

    const loadPdf = async (): Promise<void> => {
      setPdfDocument(null);
      setPageCount(0);
      setError('');

      if (!libraryRoot || !pdfPath) return;

      setIsLoading(true);
      try {
        const loadStartedAt = performance.now();
        const bytes = await papersTnetApi.papers.pdf.loadBytes({ libraryRoot, pdfPath });
        if (canceled) return;

        loadingTaskRef.current = getDocument({ data: new Uint8Array(bytes) });
        loadedDocument = await loadingTaskRef.current.promise;
        if (canceled) {
          await loadedDocument.destroy();
          return;
        }

        setPdfDocument(loadedDocument);
        setPageCount(loadedDocument.numPages);
        console.info('Loaded PDF', {
          pdfPath,
          byteLength: bytes.byteLength,
          pageCount: loadedDocument.numPages,
          durationMs: Math.round(performance.now() - loadStartedAt)
        });
      } catch (loadError) {
        console.error('Failed to load PDF', loadError);
        if (!canceled) setError('Failed to load PDF.');
      } finally {
        if (!canceled) setIsLoading(false);
      }
    };

    void loadPdf();

    return () => {
      canceled = true;
      if (!loadedDocument) {
        void loadingTaskRef.current?.destroy();
      } else {
        void loadedDocument.destroy();
      }
    };
  }, [libraryRoot, pdfPath]);

  const openExternal = async (): Promise<void> => {
    if (!libraryRoot || !pdfPath) return;
    await papersTnetApi.papers.pdf.openExternal({ libraryRoot, pdfPath });
  };

  if (!pdfPath) {
    return <div className={sharedStyles.emptyState}>No PDF registered.</div>;
  }

  const spreads = pdfDocument ? groupPdfPages(pageCount, viewMode) : [];

  return (
    <section className={styles.viewer} aria-label="PDF viewer">
      <div className={styles.toolbar}>
        <span className={styles.name}>{pdfPath}</span>
        <span className={styles.pageStatus} aria-label="PDF page count">
          {pageCount > 0 ? `${pageCount} pages` : '- pages'}
        </span>
        <div className={styles.viewMode} aria-label="PDF view mode">
          <button
            className={`${styles.modeButton} ${
              viewMode === 'single' ? styles.modeButtonActive : ''
            }`}
            type="button"
            aria-pressed={viewMode === 'single'}
            onClick={() => setViewMode('single')}
          >
            Single
          </button>
          <button
            className={`${styles.modeButton} ${
              viewMode === 'spread' ? styles.modeButtonActive : ''
            }`}
            type="button"
            aria-pressed={viewMode === 'spread'}
            onClick={() => setViewMode('spread')}
          >
            Two pages
          </button>
        </div>
        <select
          className={styles.select}
          value={zoom}
          aria-label="PDF zoom"
          onChange={(event) => setZoom(event.target.value as PdfZoomMode)}
        >
          <option value="page-width">Fit width</option>
          <option value="page-fit">Fit page</option>
          <option value="actual-size">100%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>
        <button
          className={buttonStyles.iconButton}
          type="button"
          aria-label="Open PDF"
          onClick={openExternal}
        >
          <span className="material-icons-round" aria-hidden="true">
            open_in_new
          </span>
        </button>
      </div>
      {error ? <div className={sharedStyles.emptyState}>{error}</div> : null}
      {!error ? (
        <div ref={viewportRef} className={styles.canvasViewport}>
          {isLoading ? <div className={sharedStyles.emptyState}>Loading PDF...</div> : null}
          {!isLoading && pdfDocument ? (
            <div className={styles.pages}>
              {spreads.map((spread) => (
                <div className={styles.spread} data-testid="pdf-spread" key={spread[0]}>
                  {spread.map((spreadPageNumber) => (
                    <PdfPageCanvas
                      key={spreadPageNumber}
                      pdfDocument={pdfDocument}
                      pageNumber={spreadPageNumber}
                      zoom={zoom}
                      viewportSize={viewportSize}
                      pagesInRow={viewMode === 'spread' ? 2 : 1}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
