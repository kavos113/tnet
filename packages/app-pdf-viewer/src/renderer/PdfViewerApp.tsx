import { useCallback, useEffect, useState } from 'react';
import type { PdfZoomMode } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { normalizeColumns } from '@tnet/app-pdf-viewer/shared/config';
import { createPdfLinkHref, workspaceNameForRoot } from '@tnet/app-pdf-viewer/shared/pdfLink';
import { TabBar } from '@tnet/ui';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import { PdfDocumentViewer } from './components/viewer/PdfDocumentViewer';
import { pdfViewerTnetApi } from './pdfViewerTnetApi';
import { usePdfViewerDispatch, usePdfViewerSelector } from './state/storeHooks';
import {
  closePdf,
  setDocumentPageCount,
  setActivePage,
  setPdfViewerError,
  switchPdf,
  updateActiveViewState
} from './state/pdfViewerSlice';
import styles from './PdfViewerApp.module.css';

export const PdfViewerApp = (): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  const {
    activeIndex,
    documentsByPath,
    error,
    navigationRequest,
    rootPath,
    settings,
    tabs,
    viewStateByPath
  } = usePdfViewerSelector((state) => state.pdfViewer);
  const activePath = tabs[activeIndex];
  const activeDocument = activePath ? documentsByPath[activePath] : undefined;
  const activeViewState = activePath ? viewStateByPath[activePath] : undefined;
  const [pendingColumns, setPendingColumns] = useState(String(activeViewState?.columns ?? 1));

  const zoomBy = useCallback(
    (delta: number): void => {
      if (!activeViewState) return;
      dispatch(
        updateActiveViewState({
          zoomMode: 'custom',
          customScale: activeViewState.customScale + delta
        })
      );
    },
    [activeViewState, dispatch]
  );

  useEffect(() => {
    setPendingColumns(String(activeViewState?.columns ?? 1));
  }, [activePath, activeViewState?.columns]);

  useShortcut({
    key: 'w',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: activeIndex >= 0,
    onTrigger: () => {
      dispatch(closePdf(activeIndex));
    }
  });

  useShortcut({
    key: '7',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: Boolean(activeViewState),
    onTrigger: () => {
      if (!activeViewState) return;
      dispatch(updateActiveViewState({ columns: normalizeColumns(activeViewState.columns - 1) }));
    }
  });

  useShortcut({
    key: '8',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: Boolean(activeViewState),
    onTrigger: () => {
      if (!activeViewState) return;
      dispatch(updateActiveViewState({ columns: normalizeColumns(activeViewState.columns + 1) }));
    }
  });

  useShortcut({
    key: '=',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: Boolean(activeViewState),
    onTrigger: () => zoomBy(0.1)
  });

  useShortcut({
    key: '+',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: Boolean(activeViewState),
    onTrigger: () => zoomBy(0.1)
  });

  useShortcut({
    key: '-',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: Boolean(activeViewState),
    onTrigger: () => zoomBy(-0.1)
  });

  useShortcut({
    key: '0',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: Boolean(activeViewState),
    onTrigger: () => {
      dispatch(updateActiveViewState({ zoomMode: 'actual-size', customScale: 1 }));
    }
  });

  useShortcut({
    key: 'Tab',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    enabled: tabs.length > 1,
    onTrigger: () => {
      dispatch(switchPdf((activeIndex + 1) % tabs.length));
    }
  });

  useShortcut({
    key: 'Tab',
    ctrlOrMeta: true,
    shift: true,
    target: 'document',
    allowInEditable: true,
    enabled: tabs.length > 1,
    onTrigger: () => {
      dispatch(switchPdf((activeIndex - 1 + tabs.length) % tabs.length));
    }
  });

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

  const copyPdfLink = (): void => {
    if (!rootPath || !activePath || !activePath.toLowerCase().endsWith('.pdf')) return;
    const href = createPdfLinkHref(workspaceNameForRoot(rootPath), activePath);
    navigator.clipboard
      .writeText(href)
      .then(() => dispatch(setPdfViewerError(undefined)))
      .catch((copyError: unknown) => {
        console.error('Failed to copy PDF link', copyError);
        dispatch(setPdfViewerError('Failed to copy PDF link.'));
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
            value={pendingColumns}
            disabled={!activePath}
            onChange={(event) => setPendingColumns(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={styles.applyButton}
          disabled={
            !activePath ||
            !activeViewState ||
            normalizeColumns(Number(pendingColumns)) === activeViewState.columns
          }
          onClick={() =>
            dispatch(updateActiveViewState({ columns: normalizeColumns(Number(pendingColumns)) }))
          }
        >
          Apply
        </button>
        <button
          type="button"
          className={`${styles.iconButton} material-icons-round`}
          aria-label="Copy PDF link"
          disabled={!activePath || !activePath.toLowerCase().endsWith('.pdf')}
          onClick={copyPdfLink}
        >
          content_copy
        </button>
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
          overscanPages={settings.overscanPages}
          navigationRequest={navigationRequest}
          onPageCountChange={onPageCountChange}
          onActivePageChange={(pageNumber) =>
            dispatch(setActivePage({ path: activePath, pageNumber }))
          }
          onViewStateChange={(viewState) => dispatch(updateActiveViewState(viewState))}
        />
      ) : (
        <div className={styles.empty}>Open a PDF from the sidebar.</div>
      )}
    </main>
  );
};
