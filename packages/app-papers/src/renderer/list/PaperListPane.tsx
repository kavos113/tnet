import type { PaperSummary } from '@tnet/app-papers/shared/paperTypes';
import { formatPaperJournal, formatPaperYear } from '../papers/paperDisplay';

export interface PaperListPaneProps {
  items: PaperSummary[];
  filteredItems: PaperSummary[];
  selectedPaperId: string;
  titleFilter: string;
  paperCountLabel: string;
  directoryLabel: string;
  isLoading: boolean;
  error: string;
  widthPercent: number;
  onSelectPaper: (paperId: string) => void;
  onTitleFilterChange: (titleFilter: string) => void;
  onImportPdf: () => void;
}

export const PaperListPane = ({
  items,
  filteredItems,
  selectedPaperId,
  titleFilter,
  paperCountLabel,
  directoryLabel,
  isLoading,
  error,
  widthPercent,
  onSelectPaper,
  onTitleFilterChange,
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
      <label className="papers-title-filter">
        <span>Title filter</span>
        <input
          value={titleFilter}
          aria-label="Filter papers by title"
          placeholder="Filter by title"
          onChange={(event) => onTitleFilterChange(event.target.value)}
        />
      </label>
    </div>
    {error ? <div className="papers-error">{error}</div> : null}
    {isLoading ? <div className="papers-empty-state">Loading papers...</div> : null}
    {!isLoading && items.length === 0 ? (
      <div className="papers-empty-state">Import a PDF to register a paper.</div>
    ) : null}
    {!isLoading && items.length > 0 && filteredItems.length === 0 ? (
      <div className="papers-empty-state">No papers match the current title filter.</div>
    ) : null}
    <div className="papers-list" role="table" aria-label="Papers table">
      <div className="papers-list-header" role="row">
        <span role="columnheader">Title</span>
        <span role="columnheader">Year</span>
        <span role="columnheader">Journal</span>
      </div>
      {filteredItems.map((paper) => (
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
        </button>
      ))}
    </div>
  </section>
);
