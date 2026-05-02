import type { PdfViewerSidebarPanel } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import styles from '../../PdfViewerSidebar.module.css';

const panelLabels: Record<Exclude<PdfViewerSidebarPanel, 'files'>, string> = {
  outline: 'Outline',
  thumbnails: 'Thumbnails',
  annotations: 'Annotations',
  search: 'Search'
};

const panelMessages: Record<Exclude<PdfViewerSidebarPanel, 'files'>, string> = {
  outline: 'PDF outline will appear here.',
  thumbnails: 'Page thumbnails will appear here.',
  annotations: 'PDF annotations will appear here.',
  search: 'PDF search results will appear here.'
};

export const PdfSidebarDocumentPanel = ({
  panel,
  activePath,
  activePage,
  pageCount
}: {
  panel: Exclude<PdfViewerSidebarPanel, 'files'>;
  activePath?: string;
  activePage: number;
  pageCount?: number;
}): React.JSX.Element => {
  const label = panelLabels[panel];
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
      {activePath ? (
        <div className={styles.empty}>{panelMessages[panel]}</div>
      ) : (
        <div className={styles.empty}>Open a PDF to use {label}.</div>
      )}
    </section>
  );
};
