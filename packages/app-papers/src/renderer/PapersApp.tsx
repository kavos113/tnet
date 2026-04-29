import { useMemo, useState } from 'react';
import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import { usePapersDispatch, usePapersSelector } from './storeHooks';
import { PaperDetailPane } from './detail/PaperDetailPane';
import { PaperImportDialog } from './import/PaperImportDialog';
import { usePaperImport } from './import/usePaperImport';
import { PaperListPane } from './list/PaperListPane';
import { getPaperCountLabel } from './papers/paperDisplay';
import { selectPaper, setActivePapersDetailTab, setPapersError } from './papers/papersSlice';
import { usePaperDetailLoader } from './papers/usePaperDetailLoader';
import { usePaperPaneResize } from './papers/usePaperPaneResize';
import { usePapersListLoader } from './papers/usePapersListLoader';

export const PapersApp = (): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const [titleFilter, setTitleFilter] = useState('');
  const activeLibraryRoot = usePapersSelector((state) => state.papersLibrary.activeLibraryRoot);
  const isRestored = usePapersSelector((state) => state.papersLibrary.isRestored);
  const selectedDirectoryPath = usePapersSelector(
    (state) => state.papersLibrary.selectedDirectoryPath
  );
  const activeDetailTab = usePapersSelector((state) => state.papersContent.activeDetailTab);
  const detail = usePapersSelector((state) => state.papersContent.detail);
  const error = usePapersSelector((state) => state.papersContent.error);
  const isLoadingDetail = usePapersSelector((state) => state.papersContent.isLoadingDetail);
  const isLoadingList = usePapersSelector((state) => state.papersContent.isLoadingList);
  const items = usePapersSelector((state) => state.papersContent.items);
  const selectedPaperId = usePapersSelector((state) => state.papersContent.selectedPaperId);
  const selectedDirectoryRelativePath = useMemo(() => {
    if (!activeLibraryRoot || selectedDirectoryPath === null) return undefined;
    return toWorkspaceRelativePath(activeLibraryRoot, selectedDirectoryPath);
  }, [activeLibraryRoot, selectedDirectoryPath]);
  const normalizedTitleFilter = titleFilter.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedTitleFilter) return items;
    return items.filter((paper) => paper.title.toLowerCase().includes(normalizedTitleFilter));
  }, [items, normalizedTitleFilter]);
  const paperCountLabel = getPaperCountLabel({
    filteredCount: filteredItems.length,
    totalCount: items.length,
    hasFilter: Boolean(normalizedTitleFilter)
  });
  const { listWidthPercent, detailWidthPercent, startPaneResize } = usePaperPaneResize();
  const {
    importCandidate,
    importTitle,
    setImportTitle,
    importPdf,
    confirmImportPdf,
    cancelImportPdf
  } = usePaperImport({
    activeLibraryRoot,
    selectedDirectoryRelativePath
  });

  usePapersListLoader(activeLibraryRoot, selectedDirectoryRelativePath);
  usePaperDetailLoader(activeLibraryRoot, selectedPaperId);

  if (!isRestored) {
    return (
      <main className="placeholder-app" aria-label="Papers">
        <section className="placeholder-app-content">
          <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
            article
          </span>
          <h1>Papers</h1>
          <p>Restoring paper library...</p>
        </section>
      </main>
    );
  }

  if (!activeLibraryRoot) {
    return (
      <main className="placeholder-app" aria-label="Papers">
        <section className="placeholder-app-content">
          <span className="material-icons-round placeholder-app-icon" aria-hidden="true">
            article
          </span>
          <h1>Papers</h1>
          <p>Open a paper library to begin.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="papers-app" aria-label="Papers">
      <PaperListPane
        items={items}
        filteredItems={filteredItems}
        selectedPaperId={selectedPaperId}
        titleFilter={titleFilter}
        paperCountLabel={paperCountLabel}
        directoryLabel={selectedDirectoryRelativePath ?? 'All papers'}
        isLoading={isLoadingList}
        error={error}
        widthPercent={listWidthPercent}
        onSelectPaper={(paperId) => dispatch(selectPaper(paperId))}
        onTitleFilterChange={setTitleFilter}
        onImportPdf={() => {
          importPdf().catch((importError: unknown) => {
            console.error('Failed to select PDF', importError);
          });
        }}
      />
      <div
        className="papers-pane-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize paper list and preview"
        onMouseDown={startPaneResize}
      />
      <PaperDetailPane
        activeLibraryRoot={activeLibraryRoot}
        selectedPaperId={selectedPaperId}
        detail={detail}
        activeDetailTab={activeDetailTab}
        isLoading={isLoadingDetail}
        widthPercent={detailWidthPercent}
        onSelectTab={(tab) => dispatch(setActivePapersDetailTab(tab))}
      />
      {importCandidate ? (
        <PaperImportDialog
          candidate={importCandidate}
          title={importTitle}
          onTitleChange={setImportTitle}
          onCancel={cancelImportPdf}
          onConfirm={async () => {
            try {
              await confirmImportPdf();
            } catch (importError) {
              console.error('Failed to import PDF', importError);
              dispatch(setPapersError('Failed to import PDF.'));
            }
          }}
        />
      ) : null}
    </main>
  );
};
