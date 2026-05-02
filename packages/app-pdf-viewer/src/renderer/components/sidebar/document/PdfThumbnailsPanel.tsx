import { useMemo } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfThumbnailCanvas } from '../PdfThumbnailCanvas';
import styles from '../../../PdfViewerSidebar.module.css';

export const PdfThumbnailsPanel = ({
  pdfDocument,
  activePage,
  onNavigate
}: {
  pdfDocument: PDFDocumentProxy;
  activePage: number;
  onNavigate: (pageNumber: number) => void;
}): React.JSX.Element => {
  const pages = useMemo(
    () => Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1),
    [pdfDocument.numPages]
  );
  const renderWindow = 6;
  return (
    <div className={styles.thumbnailList}>
      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={`${styles.thumbnailButton} ${
            activePage === pageNumber ? styles.thumbnailButtonActive : ''
          }`}
          onClick={() => onNavigate(pageNumber)}
        >
          {Math.abs(pageNumber - activePage) <= renderWindow ? (
            <PdfThumbnailCanvas pdfDocument={pdfDocument} pageNumber={pageNumber} />
          ) : (
            <span className={styles.thumbnailPlaceholder} aria-hidden="true" />
          )}
          <span>Page {pageNumber}</span>
        </button>
      ))}
    </div>
  );
};
