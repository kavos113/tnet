import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfViewerSidebarPanel } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { useActivePdfDocument } from '../../document/useActivePdfDocument';
import { usePdfViewerDispatch } from '../../state/storeHooks';
import { requestPageNavigation } from '../../state/pdfViewerSlice';
import { PdfAnnotationsPanel } from './document/PdfAnnotationsPanel';
import { PdfOutlinePanel } from './document/PdfOutlinePanel';
import { PdfSearchPanel } from './document/PdfSearchPanel';
import { PdfThumbnailsPanel } from './document/PdfThumbnailsPanel';
import styles from '../../PdfViewerSidebar.module.css';

const panelLabels: Record<Exclude<PdfViewerSidebarPanel, 'files'>, string> = {
  outline: 'Outline',
  thumbnails: 'Thumbnails',
  annotations: 'Annotations',
  search: 'Search'
};

export const PdfSidebarDocumentPanel = ({
  panel,
  rootPath,
  activePath,
  activePage,
  pageCount
}: {
  panel: Exclude<PdfViewerSidebarPanel, 'files'>;
  rootPath: string;
  activePath?: string;
  activePage: number;
  pageCount?: number;
}): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  const label = panelLabels[panel];
  const { pdfDocument, error, isLoading } = useActivePdfDocument({
    rootPath,
    filePath: activePath
  });
  const navigate = (pageNumber: number): void => {
    if (!activePath) return;
    dispatch(requestPageNavigation({ path: activePath, pageNumber, source: panel }));
  };

  return (
    <section className={styles.documentPanel} aria-label={`PDF ${label}`}>
      <header className={styles.documentPanelHeader}>
        <span className={styles.title}>{label}</span>
        {activePath ? (
          <span className={styles.pageBadge}>
            Page {activePage}
            {pageCount ? ` / ${pageCount}` : ''}
          </span>
        ) : null}
      </header>
      {!activePath ? <div className={styles.empty}>Open a PDF to use {label}.</div> : null}
      {activePath && isLoading ? <div className={styles.empty}>Loading PDF...</div> : null}
      {activePath && error ? <div className={styles.empty}>{error}</div> : null}
      {activePath && pdfDocument ? (
        <PdfDocumentPanelContent
          panel={panel}
          pdfDocument={pdfDocument}
          activePage={activePage}
          onNavigate={navigate}
        />
      ) : null}
    </section>
  );
};

const PdfDocumentPanelContent = ({
  panel,
  pdfDocument,
  activePage,
  onNavigate
}: {
  panel: Exclude<PdfViewerSidebarPanel, 'files'>;
  pdfDocument: PDFDocumentProxy;
  activePage: number;
  onNavigate: (pageNumber: number) => void;
}): React.JSX.Element => {
  if (panel === 'outline') {
    return <PdfOutlinePanel pdfDocument={pdfDocument} onNavigate={onNavigate} />;
  }
  if (panel === 'thumbnails') {
    return (
      <PdfThumbnailsPanel
        pdfDocument={pdfDocument}
        activePage={activePage}
        onNavigate={onNavigate}
      />
    );
  }
  if (panel === 'annotations') {
    return <PdfAnnotationsPanel pdfDocument={pdfDocument} onNavigate={onNavigate} />;
  }
  return <PdfSearchPanel pdfDocument={pdfDocument} onNavigate={onNavigate} />;
};
