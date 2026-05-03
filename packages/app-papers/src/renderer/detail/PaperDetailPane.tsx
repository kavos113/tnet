import { useState } from 'react';
import type { PaperDetail, PaperTag } from '@tnet/app-papers/shared/paperTypes';
import type { PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import sharedStyles from '../PapersShared.module.css';
import { PdfViewer } from '../papers/PdfViewer';
import { formatAuthors } from '../papers/paperDisplay';
import type { PapersDetailTab } from '../papers/papersSlice';
import { PaperMetadataPanel } from './PaperMetadataPanel';
import { PaperAiPanel } from './PaperAiPanel';
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
  onAppendToNote?: (content: string) => Promise<void>;
  onAiOutputGenerated?: (content: NonNullable<PaperDetail['aiOutputs']>[number]) => void;
  defaultAiTargetLanguage?: string;
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
  onSaveNote,
  onAppendToNote = async () => undefined,
  onAiOutputGenerated = () => undefined,
  defaultAiTargetLanguage = 'Japanese'
}: PaperDetailPaneProps): React.JSX.Element => {
  const [isSplitView, setIsSplitView] = useState(true);
  const canSplitView = Boolean(detail?.pdfPath && activeDetailTab !== 'pdf');

  return (
    <section
      className={styles.pane}
      aria-label="Paper detail"
      style={{ width: `${widthPercent}%` }}
    >
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
            {canSplitView ? (
              <button
                type="button"
                className={styles.viewToggle}
                aria-pressed={isSplitView}
                onClick={() => setIsSplitView((current) => !current)}
              >
                {isSplitView ? 'Full panel' : 'Split PDF'}
              </button>
            ) : null}
          </header>
          <nav className={styles.tabs} aria-label="Paper detail tabs">
            {(['metadata', 'pdf', 'note', 'translate', 'summary'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeDetailTab === tab ? styles.activeTab : ''}
                onClick={() => onSelectTab(tab)}
              >
                {tab === 'metadata'
                  ? 'Metadata'
                  : tab === 'pdf'
                    ? 'PDF'
                    : tab === 'note'
                      ? 'Note'
                      : tab === 'translate'
                        ? 'Translate'
                        : 'Summary'}
              </button>
            ))}
          </nav>
          {activeDetailTab === 'pdf' ? (
            <PdfViewer libraryRoot={activeLibraryRoot} pdfPath={detail.pdfPath} />
          ) : (
            <div
              className={canSplitView && isSplitView ? styles.splitContent : styles.singleContent}
            >
              {canSplitView && isSplitView ? (
                <div className={styles.splitPdf}>
                  <PdfViewer libraryRoot={activeLibraryRoot} pdfPath={detail.pdfPath} />
                </div>
              ) : null}
              <div className={styles.sidePanel}>
                {activeDetailTab === 'metadata' ? (
                  <PaperMetadataPanel
                    detail={detail}
                    availableTags={tags}
                    onCreateTag={onCreateTag}
                    onAttachTag={onAttachTag}
                    onDetachTag={onDetachTag}
                  />
                ) : null}
                {activeDetailTab === 'note' ? (
                  <PaperNoteEditor
                    paperId={detail.id}
                    content={detail.noteContent}
                    mode={noteSettings.noteEditorMode}
                    autoSaveDebounceMs={noteSettings.noteAutoSaveDebounceMs}
                    onModeChange={(mode) =>
                      onNoteSettingsChange({ ...noteSettings, noteEditorMode: mode })
                    }
                    onSave={onSaveNote}
                  />
                ) : null}
                {activeDetailTab === 'translate' || activeDetailTab === 'summary' ? (
                  <PaperAiPanel
                    libraryRoot={activeLibraryRoot}
                    paperId={detail.id}
                    pdfPath={detail.pdfPath}
                    operation={activeDetailTab === 'translate' ? 'translate' : 'summary'}
                    outputs={detail.aiOutputs ?? []}
                    defaultTargetLanguage={defaultAiTargetLanguage}
                    onGenerated={onAiOutputGenerated}
                    onAppendToNote={onAppendToNote}
                  />
                ) : null}
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
};
