import { useCallback } from 'react';
import type { PdfZoomMode } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { normalizeColumns } from '@tnet/app-pdf-viewer/shared/config';
import { TabBar } from '@tnet/ui';
import { PdfDocumentViewer } from './components/viewer/PdfDocumentViewer';
import { pdfViewerTnetApi } from './pdfViewerTnetApi';
import { usePdfViewerDispatch, usePdfViewerSelector } from './state/storeHooks';
import {
  closePdf,
  setDocumentPageCount,
  setPdfViewerError,
  switchPdf,
  updateActiveViewState
} from './state/pdfViewerSlice';
import styles from './PdfViewerApp.module.css';

export const PdfViewerApp = (): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  const { activeIndex, documentsByPath, error, rootPath, tabs, viewStateByPath } =
    usePdfViewerSelector((state) => state.pdfViewer);
  const activePath = tabs[activeIndex];
  const activeDocument = activePath ? documentsByPath[activePath] : undefined;
  const activeViewState = activePath ? viewStateByPath[activePath] : undefined;

  const onPageCountChange = useCallback(
    (pageCount: number) => {
      if (activePath) dispatch(setDocumentPageCount({ path: activePath, pageCount }));
    },
    [activePath, dispatch]
  );

  const openExternal = (): void => {
    if (!rootPath || !activePath) return;
    pdfViewerTnetApi.pdfViewer.pdf
      .openExternal({ rootDir: rootPath, path: activePath })
      .catch((openError: unknown) => {
        console.error('Failed to open PDF externally', openError);
        dispatch(setPdfViewerError('Failed to open PDF externally.'));
      });
  };

  return (
    <main className={styles.root} aria-label="PDF Viewer">
      <div className={styles.toolbar}>
        <span className={styles.title}>{activeDocument?.displayName ?? 'No PDF selected'}</span>
        <span>{activeDocument?.pageCount ? `${activeDocument.pageCount} pages` : '- pages'}</span>
        <label className={styles.control}>
          Zoom
          <select
            aria-label="PDF zoom"
            value={activeViewState?.zoomMode ?? 'page-width'}
            disabled={!activePath}
            onChange={(event) =>
              dispatch(updateActiveViewState({ zoomMode: event.target.value as PdfZoomMode }))
            }
          >
            <option value="page-width">Fit width</option>
            <option value="page-fit">Fit page</option>
            <option value="actual-size">100%</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className={styles.control}>
          Scale
          <input
            className={styles.columnsInput}
            aria-label="PDF custom scale"
            type="number"
            min={10}
            max={800}
            value={Math.round((activeViewState?.customScale ?? 1) * 100)}
            disabled={!activePath || activeViewState?.zoomMode !== 'custom'}
            onChange={(event) =>
              dispatch(updateActiveViewState({ customScale: Number(event.target.value) / 100 }))
            }
          />
        </label>
        <label className={styles.control}>
          Columns
          <input
            className={styles.columnsInput}
            aria-label="PDF columns"
            type="number"
            min={1}
            max={24}
            value={activeViewState?.columns ?? 1}
            disabled={!activePath}
            onChange={(event) =>
              dispatch(
                updateActiveViewState({ columns: normalizeColumns(Number(event.target.value)) })
              )
            }
          />
        </label>
        <button
          type="button"
          className={`${styles.iconButton} material-icons-round`}
          aria-label="Open PDF externally"
          disabled={!activePath}
          onClick={openExternal}
        >
          open_in_new
        </button>
      </div>
      <TabBar
        tabs={tabs.map((path) => ({ id: path, label: documentsByPath[path]?.displayName ?? path }))}
        activeId={activePath ?? null}
        ariaLabel="Open PDFs"
        onSelectTab={(_, index) => dispatch(switchPdf(index))}
        onCloseTab={(_, index) => dispatch(closePdf(index))}
      />
      {error ? <div className={styles.error}>{error}</div> : null}
      {activePath && activeViewState ? (
        <PdfDocumentViewer
          rootPath={rootPath}
          filePath={activePath}
          viewState={activeViewState}
          onPageCountChange={onPageCountChange}
          onViewStateChange={(viewState) => dispatch(updateActiveViewState(viewState))}
        />
      ) : (
        <div className={styles.empty}>Open a PDF from the sidebar.</div>
      )}
    </main>
  );
};
