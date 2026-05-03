import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfOutlineItem } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { extractPdfOutline } from '../../../document/pdfOutline';
import sharedStyles from '../../../PdfSidebarShared.module.css';
import styles from '../PdfSidebarDocumentPanel.module.css';

export const PdfOutlinePanel = ({
  pdfDocument,
  onNavigate
}: {
  pdfDocument: PDFDocumentProxy;
  onNavigate: (pageNumber: number) => void;
}): React.JSX.Element => {
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    setIsLoading(true);
    extractPdfOutline(pdfDocument)
      .then((items) => {
        if (!canceled) setOutline(items);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [pdfDocument]);

  if (isLoading) return <div className={sharedStyles.empty}>Loading outline...</div>;
  if (outline.length === 0)
    return <div className={sharedStyles.empty}>No outline in this PDF.</div>;
  return <OutlineList items={outline} onNavigate={onNavigate} />;
};

const OutlineList = ({
  items,
  onNavigate
}: {
  items: PdfOutlineItem[];
  onNavigate: (pageNumber: number) => void;
}): React.JSX.Element => (
  <ul className={styles.panelList}>
    {items.map((item) => (
      <li key={item.id}>
        <button
          type="button"
          className={styles.panelListButton}
          disabled={!item.pageNumber}
          onClick={() => item.pageNumber && onNavigate(item.pageNumber)}
        >
          <span>{item.title}</span>
          {item.pageNumber ? (
            <span className={sharedStyles.pageBadge}>p. {item.pageNumber}</span>
          ) : null}
        </button>
        {item.children.length > 0 ? (
          <div className={styles.nestedList}>
            <OutlineList items={item.children} onNavigate={onNavigate} />
          </div>
        ) : null}
      </li>
    ))}
  </ul>
);
