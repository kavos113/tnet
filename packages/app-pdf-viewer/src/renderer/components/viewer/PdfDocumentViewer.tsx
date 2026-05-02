import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy
} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { PdfDocumentViewState } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { pdfViewerTnetApi } from '../../pdfViewerTnetApi';
import { PdfPageCanvas } from './PdfPageCanvas';
import { groupPdfPages } from './pdfViewerLayout';
import styles from './PdfDocumentViewer.module.css';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ViewportSize {
  width: number;
  height: number;
}

export const PdfDocumentViewer = ({
  rootPath,
  filePath,
  viewState,
  onPageCountChange,
  onViewStateChange
}: {
  rootPath: string;
  filePath: string;
  viewState: PdfDocumentViewState;
  onPageCountChange: (pageCount: number) => void;
  onViewStateChange: (viewState: Partial<PdfDocumentViewState>) => void;
}): React.JSX.Element => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    if (!('ResizeObserver' in window)) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let canceled = false;
    let loadedDocument: PDFDocumentProxy | null = null;
    const loadingTaskRef = { current: null as PDFDocumentLoadingTask | null };

    const loadPdf = async (): Promise<void> => {
      setPdfDocument(null);
      setPageCount(0);
      setError('');
      if (!rootPath || !filePath) return;

      setIsLoading(true);
      try {
        const bytes = await pdfViewerTnetApi.pdfViewer.pdf.loadBytes({
          rootDir: rootPath,
          path: filePath
        });
        if (canceled) return;
        loadingTaskRef.current = getDocument({ data: new Uint8Array(bytes) });
        loadedDocument = await loadingTaskRef.current.promise;
        if (canceled) {
          await loadedDocument.destroy();
          return;
        }
        setPdfDocument(loadedDocument);
        setPageCount(loadedDocument.numPages);
        onPageCountChange(loadedDocument.numPages);
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
      if (loadedDocument) void loadedDocument.destroy();
      else void loadingTaskRef.current?.destroy();
    };
  }, [filePath, onPageCountChange, rootPath]);

  const rows = useMemo(
    () => (pdfDocument ? groupPdfPages(pageCount, viewState.columns) : []),
    [pageCount, pdfDocument, viewState.columns]
  );

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      onScroll={(event) => onViewStateChange({ scrollTop: event.currentTarget.scrollTop })}
    >
      {isLoading ? <div className={styles.empty}>Loading PDF...</div> : null}
      {error ? <div className={styles.empty}>{error}</div> : null}
      {!isLoading && !error && pdfDocument ? (
        <div className={styles.pages}>
          {rows.map((row) => (
            <div className={styles.row} key={row[0]}>
              {row.map((pageNumber) => (
                <PdfPageCanvas
                  key={pageNumber}
                  pdfDocument={pdfDocument}
                  pageNumber={pageNumber}
                  viewState={viewState}
                  viewportSize={viewportSize}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
