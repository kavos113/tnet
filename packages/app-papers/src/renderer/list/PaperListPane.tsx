import type { PaperSummary, PaperTag } from '@tnet/app-papers/shared/paperTypes';
import { formatPaperJournal, formatPaperYear } from '../papers/paperDisplay';

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
  onSelectPaper,
  onSearchQueryChange,
  onToggleTag,
  onImportPdf
}: PaperListPaneProps): React.JSX.Element => (
  <section
    className="papers-list-pane"
    aria-label="Paper list"
    style={{ width: `${widthPercent}%` }}
  >
    <header className="papers-pane-header">
      <div>
        <h1>Papers</h1>
        <span>
          {directoryLabel} - {paperCountLabel}
        </span>
      </div>
      <button
        className="icon-button"
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
    <div className="papers-list-filter">
      <label className="papers-search-filter">
        <span>Search</span>
        <input
          value={searchQuery}
          aria-label="Search papers"
          placeholder="Search title, authors, abstract, note"
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
      </label>
      {tags.length > 0 ? (
        <div className="papers-tag-filter" aria-label="Filter by tags">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`papers-tag-chip ${selectedTagIds.includes(tag.id) ? 'active' : ''}`}
              aria-pressed={selectedTagIds.includes(tag.id)}
              onClick={() => onToggleTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
    {error ? <div className="papers-error">{error}</div> : null}
    {isLoading ? <div className="papers-empty-state">Loading papers...</div> : null}
    {!isLoading && items.length === 0 ? (
      <div className="papers-empty-state">Import a PDF to register a paper.</div>
    ) : null}
    {!isLoading && items.length === 0 && (searchQuery.trim() || selectedTagIds.length > 0) ? (
      <div className="papers-empty-state">No papers match the current filters.</div>
    ) : null}
    <div className="papers-list" role="table" aria-label="Papers table">
      <div className="papers-list-header" role="row">
        <span role="columnheader">Title</span>
        <span role="columnheader">Year</span>
        <span role="columnheader">Journal</span>
        <span role="columnheader">Tags</span>
      </div>
      {items.map((paper) => (
        <button
          key={paper.id}
          className={`papers-list-item ${paper.id === selectedPaperId ? 'active' : ''}`}
          type="button"
          role="row"
          onClick={() => onSelectPaper(paper.id)}
        >
          <span className="papers-list-title" role="cell" title={paper.title}>
            {paper.title}
          </span>
          <span className="papers-list-year" role="cell">
            {formatPaperYear(paper)}
          </span>
          <span className="papers-list-journal" role="cell" title={formatPaperJournal(paper)}>
            {formatPaperJournal(paper)}
          </span>
          <span className="papers-list-tags" role="cell" title={paper.tags.join(', ')}>
            {paper.tags.length > 0 ? paper.tags.join(', ') : '-'}
          </span>
        </button>
      ))}
    </div>
  </section>
);
