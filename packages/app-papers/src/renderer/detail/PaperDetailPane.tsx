import type { PaperDetail } from '@tnet/app-papers/shared/paperTypes';
import { PdfViewer } from '../papers/PdfViewer';
import { formatAuthors } from '../papers/paperDisplay';
import type { PapersDetailTab } from '../papers/papersSlice';
import { PaperMetadataPanel } from './PaperMetadataPanel';

export interface PaperDetailPaneProps {
  activeLibraryRoot: string;
  selectedPaperId: string;
  detail: PaperDetail | null;
  activeDetailTab: PapersDetailTab;
  isLoading: boolean;
  widthPercent: number;
  onSelectTab: (tab: PapersDetailTab) => void;
}

export const PaperDetailPane = ({
  activeLibraryRoot,
  selectedPaperId,
  detail,
  activeDetailTab,
  isLoading,
  widthPercent,
  onSelectTab
}: PaperDetailPaneProps): React.JSX.Element => (
  <section
    className="papers-detail-pane"
    aria-label="Paper detail"
    style={{ width: `${widthPercent}%` }}
  >
    {!selectedPaperId ? <div className="papers-empty-state">Select a paper.</div> : null}
    {selectedPaperId && isLoading ? (
      <div className="papers-empty-state">Loading paper detail...</div>
    ) : null}
    {detail && !isLoading ? (
      <>
        <header className="papers-detail-header">
          <div>
            <h2>{detail.title}</h2>
            <span>{formatAuthors(detail)}</span>
          </div>
        </header>
        <nav className="papers-detail-tabs" aria-label="Paper detail tabs">
          {(['metadata', 'pdf', 'note'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeDetailTab === tab ? 'active' : ''}
              onClick={() => onSelectTab(tab)}
            >
              {tab === 'metadata' ? 'Metadata' : tab === 'pdf' ? 'PDF' : 'Note'}
            </button>
          ))}
        </nav>
        {activeDetailTab === 'metadata' ? <PaperMetadataPanel detail={detail} /> : null}
        {activeDetailTab === 'pdf' ? (
          <PdfViewer libraryRoot={activeLibraryRoot} pdfPath={detail.pdfPath} />
        ) : null}
        {activeDetailTab === 'note' ? (
          <textarea className="papers-note-editor" value={detail.noteContent} readOnly />
        ) : null}
      </>
    ) : null}
  </section>
);
