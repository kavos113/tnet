import type { PaperDetail, PaperTag } from '@tnet/app-papers/shared/paperTypes';
import { PdfViewer } from '../papers/PdfViewer';
import { formatAuthors } from '../papers/paperDisplay';
import type { PapersDetailTab } from '../papers/papersSlice';
import { PaperMetadataPanel } from './PaperMetadataPanel';
import { PaperNoteEditor } from './PaperNoteEditor';

export interface PaperDetailPaneProps {
  activeLibraryRoot: string;
  selectedPaperId: string;
  detail: PaperDetail | null;
  tags: PaperTag[];
  activeDetailTab: PapersDetailTab;
  isLoading: boolean;
  widthPercent: number;
  noteEditorMode: 'editor' | 'preview' | 'split';
  noteAutoSaveDebounceMs: number;
  onSelectTab: (tab: PapersDetailTab) => void;
  onCreateTag: (name: string) => void;
  onAttachTag: (tagId: string) => void;
  onDetachTag: (tagId: string) => void;
  onSaveNote: (content: string) => Promise<void>;
}

export const PaperDetailPane = ({
  activeLibraryRoot,
  selectedPaperId,
  detail,
  tags,
  activeDetailTab,
  isLoading,
  widthPercent,
  noteEditorMode,
  noteAutoSaveDebounceMs,
  onSelectTab,
  onCreateTag,
  onAttachTag,
  onDetachTag,
  onSaveNote
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
        {activeDetailTab === 'metadata' ? (
          <PaperMetadataPanel
            detail={detail}
            availableTags={tags}
            onCreateTag={onCreateTag}
            onAttachTag={onAttachTag}
            onDetachTag={onDetachTag}
          />
        ) : null}
        {activeDetailTab === 'pdf' ? (
          <PdfViewer libraryRoot={activeLibraryRoot} pdfPath={detail.pdfPath} />
        ) : null}
        {activeDetailTab === 'note' ? (
          <PaperNoteEditor
            paperId={detail.id}
            content={detail.noteContent}
            mode={noteEditorMode}
            autoSaveDebounceMs={noteAutoSaveDebounceMs}
            onSave={onSaveNote}
          />
        ) : null}
      </>
    ) : null}
  </section>
);
