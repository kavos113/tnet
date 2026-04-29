import { useMemo, useState } from 'react';
import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import { usePapersDispatch, usePapersSelector } from './storeHooks';
import { PaperDetailPane } from './detail/PaperDetailPane';
import { PaperImportDialog } from './import/PaperImportDialog';
import { usePaperImport } from './import/usePaperImport';
import { PaperListPane } from './list/PaperListPane';
import { papersTnetApi } from './papersTnetApi';
import { getPaperCountLabel } from './papers/paperDisplay';
import {
  selectPaper,
  setActivePapersDetailTab,
  setPaperDetail,
  setPapers,
  setPapersError,
  setPaperTags,
  toggleSelectedPaperTag
} from './papers/papersSlice';
import { usePaperDetailLoader } from './papers/usePaperDetailLoader';
import { usePaperPaneResize } from './papers/usePaperPaneResize';
import { usePaperTagsLoader } from './papers/usePaperTagsLoader';
import { usePapersListLoader } from './papers/usePapersListLoader';

export const PapersApp = (): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const [searchQuery, setSearchQuery] = useState('');
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
  const selectedTagIds = usePapersSelector((state) => state.papersContent.selectedTagIds);
  const tags = usePapersSelector((state) => state.papersContent.tags);
  const selectedDirectoryRelativePath = useMemo(() => {
    if (!activeLibraryRoot || selectedDirectoryPath === null) return undefined;
    return toWorkspaceRelativePath(activeLibraryRoot, selectedDirectoryPath);
  }, [activeLibraryRoot, selectedDirectoryPath]);
  const paperCountLabel = getPaperCountLabel({
    filteredCount: items.length,
    totalCount: items.length,
    hasFilter: false
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

  usePapersListLoader(
    activeLibraryRoot,
    selectedDirectoryRelativePath,
    searchQuery,
    selectedTagIds
  );
  usePaperTagsLoader(activeLibraryRoot);
  usePaperDetailLoader(activeLibraryRoot, selectedPaperId);

  const reloadPapers = async (): Promise<void> => {
    if (!activeLibraryRoot) return;
    const [papers, paperTags] = await Promise.all([
      papersTnetApi.papers.papers.list({
        libraryRoot: activeLibraryRoot,
        directoryPath: selectedDirectoryRelativePath,
        query: searchQuery,
        tagIds: selectedTagIds
      }),
      papersTnetApi.papers.tags.list({ libraryRoot: activeLibraryRoot })
    ]);
    dispatch(setPapers(papers));
    dispatch(setPaperTags(paperTags));
  };

  const createAndAttachTag = async (name: string): Promise<void> => {
    if (!activeLibraryRoot || !selectedPaperId) return;
    try {
      const tag = await papersTnetApi.papers.tags.upsert({ libraryRoot: activeLibraryRoot, name });
      const updatedDetail = await papersTnetApi.papers.tags.attach({
        libraryRoot: activeLibraryRoot,
        paperId: selectedPaperId,
        tagId: tag.id
      });
      dispatch(setPaperDetail(updatedDetail));
      await reloadPapers();
    } catch (tagError) {
      console.error('Failed to create paper tag', tagError);
      dispatch(setPapersError('Failed to update paper tags.'));
    }
  };

  const attachTag = async (tagId: string): Promise<void> => {
    if (!activeLibraryRoot || !selectedPaperId) return;
    try {
      const updatedDetail = await papersTnetApi.papers.tags.attach({
        libraryRoot: activeLibraryRoot,
        paperId: selectedPaperId,
        tagId
      });
      dispatch(setPaperDetail(updatedDetail));
      await reloadPapers();
    } catch (tagError) {
      console.error('Failed to attach paper tag', tagError);
      dispatch(setPapersError('Failed to update paper tags.'));
    }
  };

  const detachTag = async (tagId: string): Promise<void> => {
    if (!activeLibraryRoot || !selectedPaperId) return;
    try {
      const updatedDetail = await papersTnetApi.papers.tags.detach({
        libraryRoot: activeLibraryRoot,
        paperId: selectedPaperId,
        tagId
      });
      dispatch(setPaperDetail(updatedDetail));
      await reloadPapers();
    } catch (tagError) {
      console.error('Failed to detach paper tag', tagError);
      dispatch(setPapersError('Failed to update paper tags.'));
    }
  };

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
        tags={tags}
        selectedPaperId={selectedPaperId}
        searchQuery={searchQuery}
        selectedTagIds={selectedTagIds}
        paperCountLabel={paperCountLabel}
        directoryLabel={selectedDirectoryRelativePath ?? 'All papers'}
        isLoading={isLoadingList}
        error={error}
        widthPercent={listWidthPercent}
        onSelectPaper={(paperId) => dispatch(selectPaper(paperId))}
        onSearchQueryChange={setSearchQuery}
        onToggleTag={(tagId) => dispatch(toggleSelectedPaperTag(tagId))}
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
        tags={tags}
        activeDetailTab={activeDetailTab}
        isLoading={isLoadingDetail}
        widthPercent={detailWidthPercent}
        onSelectTab={(tab) => dispatch(setActivePapersDetailTab(tab))}
        onCreateTag={(name) => {
          createAndAttachTag(name).catch((tagError: unknown) => {
            console.error('Failed to create paper tag', tagError);
          });
        }}
        onAttachTag={(tagId) => {
          attachTag(tagId).catch((tagError: unknown) => {
            console.error('Failed to attach paper tag', tagError);
          });
        }}
        onDetachTag={(tagId) => {
          detachTag(tagId).catch((tagError: unknown) => {
            console.error('Failed to detach paper tag', tagError);
          });
        }}
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
