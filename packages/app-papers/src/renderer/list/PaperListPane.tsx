import type { PaperSummary, PaperTag } from '@tnet/app-papers/shared/paperTypes';
import sharedStyles from '../PapersShared.module.css';
import buttonStyles from '../PapersButtons.module.css';
import { formatPaperJournal, formatPaperYear } from '../papers/paperDisplay';
import filterStyles from './PaperListFilter.module.css';
import styles from './PaperListPane.module.css';
import tableStyles from './PaperListTable.module.css';

export interface PaperListPaneProps {
  items: PaperSummary[];
  tags: PaperTag[];
  selectedPaperId: string;
  searchQuery: string;
  selectedTagIds: string[];
  paperCountLabel: string;
  directoryLabel: string;
  isLoading: boolean;
  error: string;
  widthPercent: number;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelectPaper: (paperId: string) => void;
  onSearchQueryChange: (query: string) => void;
  onToggleTag: (tagId: string) => void;
  onImportPdf: () => void;
}

export const PaperListPane = ({
  items,
  tags,
  selectedPaperId,
  searchQuery,
  selectedTagIds,
  paperCountLabel,
  directoryLabel,
  isLoading,
  error,
  widthPercent,
  searchInputRef,
  onSelectPaper,
  onSearchQueryChange,
  onToggleTag,
  onImportPdf
}: PaperListPaneProps): React.JSX.Element => {
  const normalizedSearchQuery = searchQuery.trim();

  return (
    <section className={styles.pane} aria-label="Paper list" style={{ width: `${widthPercent}%` }}>
      <header className={styles.header}>
        <div>
          <h1>Papers</h1>
          <span>
            {directoryLabel} - {paperCountLabel}
          </span>
        </div>
        <button
          className={buttonStyles.iconButton}
          type="button"
          aria-label="Import PDF"
          onClick={() => {
            onImportPdf();
          }}
        >
          <span className="material-icons-round" aria-hidden="true">
            upload_file
          </span>
        </button>
      </header>
      <div className={filterStyles.filter}>
        <label className={filterStyles.searchFilter}>
          <span>Search</span>
          <input
            ref={searchInputRef}
            value={searchQuery}
            aria-label="Search papers"
            placeholder="Search title, authors, abstract, note"
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </label>
        {tags.length > 0 ? (
          <div className={filterStyles.tagFilter} aria-label="Filter by tags">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`${filterStyles.tagChip} ${
                  selectedTagIds.includes(tag.id) ? filterStyles.tagChipActive : ''
                }`}
                aria-pressed={selectedTagIds.includes(tag.id)}
                onClick={() => onToggleTag(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      {isLoading ? <div className={sharedStyles.emptyState}>Loading papers...</div> : null}
      {!isLoading && items.length === 0 ? (
        <div className={sharedStyles.emptyState}>Import a PDF to register a paper.</div>
      ) : null}
      {!isLoading && items.length === 0 && (searchQuery.trim() || selectedTagIds.length > 0) ? (
        <div className={sharedStyles.emptyState}>No papers match the current filters.</div>
      ) : null}
      <div className={tableStyles.list} role="table" aria-label="Papers table">
        <div className={tableStyles.listHeader} role="row">
          <span role="columnheader">Title</span>
          <span role="columnheader">Year</span>
          <span role="columnheader">Journal</span>
          <span role="columnheader">Tags</span>
        </div>
        {items.map((paper) => (
          <button
            key={paper.id}
            className={`${tableStyles.listItem} ${
              paper.id === selectedPaperId ? tableStyles.listItemActive : ''
            }`}
            type="button"
            role="row"
            onClick={() => onSelectPaper(paper.id)}
          >
            <span className={tableStyles.title} role="cell" title={paper.title}>
              {highlightSearchMatch(paper.title, normalizedSearchQuery)}
            </span>
            <span className={tableStyles.year} role="cell">
              {formatPaperYear(paper)}
            </span>
            <span className={tableStyles.journal} role="cell" title={formatPaperJournal(paper)}>
              {highlightSearchMatch(formatPaperJournal(paper), normalizedSearchQuery)}
            </span>
            <span className={tableStyles.tags} role="cell" title={paper.tags.join(', ')}>
              {highlightSearchMatch(
                paper.tags.length > 0 ? paper.tags.join(', ') : '-',
                normalizedSearchQuery
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

const highlightSearchMatch = (value: string, query: string): React.ReactNode => {
  if (!query) return value;

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let start = 0;

  while (start < value.length) {
    const matchIndex = lowerValue.indexOf(lowerQuery, start);
    if (matchIndex === -1) {
      parts.push(value.slice(start));
      break;
    }
    if (matchIndex > start) {
      parts.push(value.slice(start, matchIndex));
    }
    const matchEnd = matchIndex + query.length;
    parts.push(
      <mark key={`${matchIndex}:${matchEnd}`} className={tableStyles.highlight}>
        {value.slice(matchIndex, matchEnd)}
      </mark>
    );
    start = matchEnd;
  }

  return parts;
};
