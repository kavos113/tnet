import type { PaperDetail, PaperTag } from '@tnet/app-papers/shared/paperTypes';
import type { PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import sharedStyles from '../PapersShared.module.css';
import { PdfViewer } from '../papers/PdfViewer';
import { formatAuthors } from '../papers/paperDisplay';
import type { PapersDetailTab } from '../papers/papersSlice';
import { PaperMetadataPanel } from './PaperMetadataPanel';
import { PaperNoteEditor } from './PaperNoteEditor';
import styles from './PaperDetailPane.module.css';

export interface PaperDetailPaneProps {
  activeLibraryRoot: string;
  selectedPaperId: string;
  detail: PaperDetail | null;
  tags: PaperTag[];
  activeDetailTab: PapersDetailTab;
  isLoading: boolean;
  widthPercent: number;
  noteSettings: PapersLibraryConfig;
  onNoteSettingsChange: (settings: PapersLibraryConfig) => void;
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
  noteSettings,
  onNoteSettingsChange,
  onSelectTab,
  onCreateTag,
  onAttachTag,
  onDetachTag,
  onSaveNote
}: PaperDetailPaneProps): React.JSX.Element => (
  <section className={styles.pane} aria-label="Paper detail" style={{ width: `${widthPercent}%` }}>
    {!selectedPaperId ? <div className={sharedStyles.emptyState}>Select a paper.</div> : null}
    {selectedPaperId && isLoading ? (
      <div className={sharedStyles.emptyState}>Loading paper detail...</div>
    ) : null}
    {detail && !isLoading ? (
      <>
        <header className={styles.header}>
          <div>
            <h2>{detail.title}</h2>
            <span>{formatAuthors(detail)}</span>
          </div>
        </header>
        <nav className={styles.tabs} aria-label="Paper detail tabs">
          {(['metadata', 'pdf', 'note'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeDetailTab === tab ? styles.activeTab : ''}
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
            mode={noteSettings.noteEditorMode}
            autoSaveDebounceMs={noteSettings.noteAutoSaveDebounceMs}
            editorFontFamily={noteSettings.noteEditorFontFamily}
            editorFontSize={noteSettings.noteEditorFontSize}
            previewFontFamily={noteSettings.notePreviewFontFamily}
            previewFontSize={noteSettings.notePreviewFontSize}
            onModeChange={(mode) => onNoteSettingsChange({ ...noteSettings, noteEditorMode: mode })}
            onSave={onSaveNote}
          />
        ) : null}
      </>
    ) : null}
  </section>
);
