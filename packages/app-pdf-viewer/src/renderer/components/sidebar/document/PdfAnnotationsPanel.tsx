import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfAnnotationItem } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { extractPdfAnnotations } from '../../../document/pdfAnnotations';
import styles from '../../../PdfViewerSidebar.module.css';

export const PdfAnnotationsPanel = ({
  pdfDocument,
  onNavigate
}: {
  pdfDocument: PDFDocumentProxy;
  onNavigate: (pageNumber: number) => void;
}): React.JSX.Element => {
  const [annotations, setAnnotations] = useState<PdfAnnotationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    setIsLoading(true);
    extractPdfAnnotations(pdfDocument)
      .then((items) => {
        if (!canceled) setAnnotations(items);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [pdfDocument]);

  if (isLoading) return <div className={styles.empty}>Loading annotations...</div>;
  if (annotations.length === 0)
    return <div className={styles.empty}>No annotations in this PDF.</div>;
  return (
    <ul className={styles.panelList}>
      {annotations.map((annotation) => (
        <li key={annotation.id}>
          <button
            type="button"
            className={styles.panelListButton}
            onClick={() => {
              if (annotation.url) window.open(annotation.url, '_blank', 'noopener,noreferrer');
              else onNavigate(annotation.pageNumber);
            }}
          >
            <span>{annotation.contents || annotation.title || annotation.subtype}</span>
            <span className={styles.pageBadge}>p. {annotation.pageNumber}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
