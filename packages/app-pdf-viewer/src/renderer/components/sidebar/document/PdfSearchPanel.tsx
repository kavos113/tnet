import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfSearchResult } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import { searchPdfText } from '../../../document/pdfTextSearch';
import sharedStyles from '../../../PdfSidebarShared.module.css';
import documentStyles from '../PdfSidebarDocumentPanel.module.css';
import styles from './PdfSearchPanel.module.css';

export const PdfSearchPanel = ({
  pdfDocument,
  onNavigate
}: {
  pdfDocument: PDFDocumentProxy;
  onNavigate: (pageNumber: number) => void;
}): React.JSX.Element => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PdfSearchResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let canceled = false;
    setIsLoading(Boolean(query.trim()));
    const timeoutId = window.setTimeout(() => {
      searchPdfText(pdfDocument, query)
        .then((items) => {
          if (!canceled) {
            setResults(items);
            setActiveResultIndex(0);
          }
        })
        .finally(() => {
          if (!canceled) setIsLoading(false);
        });
    }, 150);
    return () => {
      canceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pdfDocument, query]);

  const navigateResult = (nextIndex: number): void => {
    const result = results[nextIndex];
    if (!result) return;
    setActiveResultIndex(nextIndex);
    onNavigate(result.pageNumber);
  };

  return (
    <div className={styles.searchPanel}>
      <input
        className={styles.searchInput}
        aria-label="Search PDF text"
        value={query}
        placeholder="Search PDF"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={sharedStyles.pageBadge}>
        {isLoading ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}`}
      </div>
      <div className={styles.searchActions}>
        <button
          type="button"
          disabled={results.length === 0}
          onClick={() => navigateResult((activeResultIndex - 1 + results.length) % results.length)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={results.length === 0}
          onClick={() => navigateResult((activeResultIndex + 1) % results.length)}
        >
          Next
        </button>
      </div>
      <ul className={documentStyles.panelList}>
        {results.map((result, index) => (
          <li key={result.id}>
            <button
              type="button"
              className={documentStyles.panelListButton}
              onClick={() => navigateResult(index)}
            >
              <span>{result.snippet}</span>
              <span className={sharedStyles.pageBadge}>p. {result.pageNumber}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
