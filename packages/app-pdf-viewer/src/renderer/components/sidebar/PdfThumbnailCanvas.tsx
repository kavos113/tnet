import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import styles from '../../PdfViewerSidebar.module.css';

const thumbnailWidth = 120;

export const PdfThumbnailCanvas = ({
  pdfDocument,
  pageNumber
}: {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
}): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let canceled = false;
    renderTaskRef.current?.cancel();
    setError('');

    const renderThumbnail = async (): Promise<void> => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (canceled) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = thumbnailWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D context is not available.');

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderTask = page.render({ canvasContext: context, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (renderError) {
        if (
          !canceled &&
          !(renderError instanceof Error && renderError.name === 'RenderingCancelledException')
        ) {
          console.error('Failed to render PDF thumbnail', renderError);
          setError('Failed');
        }
      }
    };

    void renderThumbnail();

    return () => {
      canceled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pageNumber, pdfDocument]);

  return (
    <span className={styles.thumbnailCanvasWrap}>
      <canvas
        ref={canvasRef}
        className={styles.thumbnailCanvas}
        aria-label={`Page ${pageNumber}`}
      />
      {error ? <span className={styles.thumbnailError}>{error}</span> : null}
    </span>
  );
};
