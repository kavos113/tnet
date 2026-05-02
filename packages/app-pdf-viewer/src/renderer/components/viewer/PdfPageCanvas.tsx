import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { PdfDocumentViewState } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { getPdfRenderScale, pdfPageGapPx, pdfViewportPaddingPx } from './pdfViewerLayout';
import styles from './PdfDocumentViewer.module.css';

interface ViewportSize {
  width: number;
  height: number;
}

export const PdfPageCanvas = ({
  pdfDocument,
  pageNumber,
  viewState,
  viewportSize
}: {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  viewState: PdfDocumentViewState;
  viewportSize: ViewportSize;
}): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let canceled = false;

    const renderPage = async (): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderTaskRef.current?.cancel();
      setError('');

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (canceled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = getPdfRenderScale({
          viewState,
          pageWidth: baseViewport.width,
          pageHeight: baseViewport.height,
          viewportWidth: viewportSize.width,
          viewportHeight: viewportSize.height,
          gapPx: pdfPageGapPx,
          paddingPx: pdfViewportPaddingPx
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
          setError('Failed to render page.');
        }
      }
    };

    void renderPage();

    return () => {
      canceled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pageNumber, pdfDocument, viewState, viewportSize.height, viewportSize.width]);

  return (
    <figure className={styles.page} aria-label={`PDF page ${pageNumber}`}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label={`PDF page ${pageNumber} canvas`}
      />
      {error ? <figcaption className={styles.pageError}>{error}</figcaption> : null}
    </figure>
  );
};
