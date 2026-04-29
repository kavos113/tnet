import { useEffect, useRef, useState } from 'react';
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask
} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { papersTnetApi } from '../papersTnetApi';

interface PdfViewerProps {
  libraryRoot: string;
  pdfPath?: string;
}

type PdfZoomMode = 'page-width' | 'page-fit' | 'actual-size' | '150' | '200';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const zoomScale = (zoom: PdfZoomMode): number | null => {
  if (zoom === 'actual-size') return 1;
  if (zoom === '150') return 1.5;
  if (zoom === '200') return 2;
  return null;
};

const fitScale = ({
  zoom,
  pageWidth,
  pageHeight,
  viewportWidth,
  viewportHeight
}: {
  zoom: PdfZoomMode;
  pageWidth: number;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}): number => {
  const fixedScale = zoomScale(zoom);
  if (fixedScale !== null) return fixedScale;

  const widthScale = viewportWidth > 0 ? viewportWidth / pageWidth : 1;
  if (zoom === 'page-width') return Math.max(widthScale, 0.1);

  const heightScale = viewportHeight > 0 ? viewportHeight / pageHeight : widthScale;
  return Math.max(Math.min(widthScale, heightScale), 0.1);
};

export const PdfViewer = ({ libraryRoot, pdfPath }: PdfViewerProps): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState<PdfZoomMode>('page-width');

  useEffect(() => {
    let canceled = false;
    let loadedDocument: PDFDocumentProxy | null = null;
    const loadingTaskRef = { current: null as ReturnType<typeof getDocument> | null };

    const loadPdf = async (): Promise<void> => {
      setPdfDocument(null);
      setPageNumber(1);
      setPageCount(0);
      setError('');

      if (!libraryRoot || !pdfPath) return;

      setIsLoading(true);
      try {
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
      renderTaskRef.current?.cancel();
      if (!loadedDocument) {
        void loadingTaskRef.current?.destroy();
      } else {
        void loadedDocument.destroy();
      }
    };
  }, [libraryRoot, pdfPath]);

  useEffect(() => {
    let canceled = false;

    const renderPage = async (): Promise<void> => {
      const canvas = canvasRef.current;
      const viewportElement = viewportRef.current;
      if (!pdfDocument || !canvas || !viewportElement) return;

      setIsRendering(true);
      setError('');
      renderTaskRef.current?.cancel();

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (canceled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = fitScale({
          zoom,
          pageWidth: baseViewport.width,
          pageHeight: baseViewport.height,
          viewportWidth: Math.max(viewportElement.clientWidth - 32, 1),
          viewportHeight: Math.max(viewportElement.clientHeight - 32, 1)
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
  }, [pageNumber, pdfDocument, zoom]);

  const openExternal = async (): Promise<void> => {
    if (!libraryRoot || !pdfPath) return;
    await papersTnetApi.papers.pdf.openExternal({ libraryRoot, pdfPath });
  };

  if (!pdfPath) {
    return <div className="papers-empty-state">No PDF registered.</div>;
  }

  return (
    <section className="papers-pdf-viewer" aria-label="PDF viewer">
      <div className="papers-pdf-toolbar">
        <span className="papers-pdf-name">{pdfPath}</span>
        <button
          className="icon-button"
          type="button"
          aria-label="Previous page"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((current) => Math.max(current - 1, 1))}
        >
          <span className="material-icons-round" aria-hidden="true">
            chevron_left
          </span>
        </button>
        <span className="papers-pdf-page-status" aria-label="PDF page">
          {pageCount > 0 ? `${pageNumber} / ${pageCount}` : '- / -'}
        </span>
        <button
          className="icon-button"
          type="button"
          aria-label="Next page"
          disabled={pageCount === 0 || pageNumber >= pageCount}
          onClick={() => setPageNumber((current) => Math.min(current + 1, pageCount))}
        >
          <span className="material-icons-round" aria-hidden="true">
            chevron_right
          </span>
        </button>
        <select
          className="papers-select"
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
        <button className="icon-button" type="button" aria-label="Open PDF" onClick={openExternal}>
          <span className="material-icons-round" aria-hidden="true">
            open_in_new
          </span>
        </button>
      </div>
      {error ? <div className="papers-empty-state">{error}</div> : null}
      {!error ? (
        <div ref={viewportRef} className="papers-pdf-canvas-viewport">
          {isLoading ? <div className="papers-empty-state">Loading PDF...</div> : null}
          {!isLoading && isRendering ? (
            <div className="papers-pdf-rendering-state">Rendering page...</div>
          ) : null}
          <canvas ref={canvasRef} className="papers-pdf-canvas" aria-label="PDF page canvas" />
        </div>
      ) : null}
    </section>
  );
};
