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
import { pdfJsAssetUrls } from './pdfJsAssets';
import { PdfViewerCMapReaderFactory, PdfViewerStandardFontDataFactory } from './pdfJsFactories';
import {
  getPdfRenderScale,
  getVisiblePdfRowWindow,
  groupPdfPages,
  pdfPageGapPx,
  pdfViewportPaddingPx
} from './pdfViewerLayout';
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
  overscanPages,
  onPageCountChange,
  onViewStateChange
}: {
  rootPath: string;
  filePath: string;
  viewState: PdfDocumentViewState;
  overscanPages: number;
  onPageCountChange: (pageCount: number) => void;
  onViewStateChange: (viewState: Partial<PdfDocumentViewState>) => void;
}): React.JSX.Element => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const restoredScrollKeyRef = useRef('');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [firstPageSize, setFirstPageSize] = useState<ViewportSize | null>(null);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(viewState.scrollTop);
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
      setFirstPageSize(null);
      setError('');
      if (!rootPath || !filePath) return;

      setIsLoading(true);
      try {
        const bytes = await pdfViewerTnetApi.pdfViewer.pdf.loadBytes({
          rootDir: rootPath,
          path: filePath
        });
        if (canceled) return;
        loadingTaskRef.current = getDocument({
          data: new Uint8Array(bytes),
          CMapReaderFactory: PdfViewerCMapReaderFactory,
          StandardFontDataFactory: PdfViewerStandardFontDataFactory,
          cMapPacked: true,
          disableFontFace: false,
          useSystemFonts: true,
          useWorkerFetch: false,
          ...pdfJsAssetUrls()
        });
        loadedDocument = await loadingTaskRef.current.promise;
        if (canceled) {
          await loadedDocument.destroy();
          return;
        }
        const firstPage = await loadedDocument.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 1 });
        if (canceled) {
          await loadedDocument.destroy();
          return;
        }
        setFirstPageSize({
          width: firstViewport.width,
          height: firstViewport.height
        });
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

  useEffect(() => {
    restoredScrollKeyRef.current = '';
  }, [filePath]);

  useEffect(() => {
    setScrollTop(viewState.scrollTop);
  }, [viewState.scrollTop]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !pdfDocument) return;
    const restoreKey = `${filePath}:${pdfDocument.numPages}`;
    if (restoredScrollKeyRef.current === restoreKey) return;
    restoredScrollKeyRef.current = restoreKey;
    viewport.scrollTop = viewState.scrollTop;
    setScrollTop(viewState.scrollTop);
  }, [filePath, pdfDocument, viewState.scrollTop]);

  const rows = useMemo(
    () => (pdfDocument ? groupPdfPages(pageCount, viewState.columns) : []),
    [pageCount, pdfDocument, viewState.columns]
  );

  const estimatedRowHeight = useMemo(() => {
    if (!firstPageSize) return 0;
    return (
      firstPageSize.height *
      getPdfRenderScale({
        viewState,
        pageWidth: firstPageSize.width,
        pageHeight: firstPageSize.height,
        viewportWidth: viewportSize.width,
        viewportHeight: viewportSize.height,
        gapPx: pdfPageGapPx,
        paddingPx: pdfViewportPaddingPx
      })
    );
  }, [firstPageSize, viewState, viewportSize.height, viewportSize.width]);

  const visibleRows = useMemo(() => {
    const overscanRows = Math.max(Math.ceil(overscanPages / Math.max(viewState.columns, 1)), 0);
    return getVisiblePdfRowWindow({
      rowCount: rows.length,
      scrollTop,
      viewportHeight: viewportSize.height,
      rowHeight: estimatedRowHeight,
      rowGapPx: pdfPageGapPx,
      paddingPx: pdfPageGapPx,
      overscanRows
    });
  }, [
    estimatedRowHeight,
    overscanPages,
    rows.length,
    scrollTop,
    viewState.columns,
    viewportSize.height
  ]);

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop);
        onViewStateChange({ scrollTop: event.currentTarget.scrollTop });
      }}
    >
      {isLoading ? <div className={styles.empty}>Loading PDF...</div> : null}
      {error ? <div className={styles.empty}>{error}</div> : null}
      {!isLoading && !error && pdfDocument ? (
        <div className={styles.pages}>
          {rows.map((row, rowIndex) =>
            rowIndex < visibleRows.firstRowIndex || rowIndex > visibleRows.lastRowIndex ? (
              <div
                className={styles.rowPlaceholder}
                key={row[0]}
                style={{ height: estimatedRowHeight || undefined }}
                aria-hidden="true"
              />
            ) : (
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
            )
          )}
        </div>
      ) : null}
    </div>
  );
};
