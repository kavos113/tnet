import { useEffect, useMemo, useState } from 'react';
import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import type { PaperSummary } from '@tnet/app-papers/shared/paperTypes';
import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import { usePapersDispatch, usePapersSelector } from './storeHooks';
import { papersTnetApi } from './papersTnetApi';
import { PdfViewer } from './papers/PdfViewer';
import {
  selectPaper,
  setActivePapersDetailTab,
  setPaperDetail,
  setPapers,
  setPapersDetailLoading,
  setPapersError,
  setPapersListLoading
} from './papers/papersSlice';

const formatAuthors = (paper: PaperSummary): string =>
  paper.authors.length > 0 ? paper.authors.join(', ') : 'No authors';

const importTargetLabel = (candidate: SelectedPdfImportCandidate): string => {
  if (candidate.sourceRelativePath) return candidate.sourceRelativePath;
  const fileName = candidate.sourcePath.split(/[\\/]/).pop() ?? 'paper.pdf';
  const directoryPath = candidate.targetDirectoryPath || 'papers';
  return `${directoryPath}/${fileName}`;
};

export const PapersApp = (): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const [importCandidate, setImportCandidate] = useState<SelectedPdfImportCandidate | null>(null);
  const [importTitle, setImportTitle] = useState('');
  const { activeLibraryRoot, isRestored, selectedDirectoryPath } = usePapersSelector(
    (state) => state.papersLibrary
  );
  const { activeDetailTab, detail, error, isLoadingDetail, isLoadingList, items, selectedPaperId } =
    usePapersSelector((state) => state.papersContent);
  const selectedDirectoryRelativePath = useMemo(() => {
    if (!activeLibraryRoot || selectedDirectoryPath === null) return undefined;
    return toWorkspaceRelativePath(activeLibraryRoot, selectedDirectoryPath);
  }, [activeLibraryRoot, selectedDirectoryPath]);

  useEffect(() => {
    let canceled = false;

    const loadPapers = async (): Promise<void> => {
      if (!activeLibraryRoot) return;
      dispatch(setPapersListLoading(true));
      dispatch(setPapersError(''));
      try {
        const papers = await papersTnetApi.papers.papers.list({
          libraryRoot: activeLibraryRoot,
          directoryPath: selectedDirectoryRelativePath
        });
        if (!canceled) dispatch(setPapers(papers));
      } catch (loadError) {
        console.error('Failed to load papers', loadError);
        if (!canceled) dispatch(setPapersError('Failed to load papers.'));
      } finally {
        if (!canceled) dispatch(setPapersListLoading(false));
      }
    };

    void loadPapers();

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, dispatch, selectedDirectoryRelativePath]);

  useEffect(() => {
    let canceled = false;

    const loadDetail = async (): Promise<void> => {
      if (!activeLibraryRoot || !selectedPaperId) return;
      dispatch(setPapersDetailLoading(true));
      try {
        const paper = await papersTnetApi.papers.papers.get({
          libraryRoot: activeLibraryRoot,
          paperId: selectedPaperId
        });
        if (!canceled) dispatch(setPaperDetail(paper));
      } catch (loadError) {
        console.error('Failed to load paper detail', loadError);
        if (!canceled) dispatch(setPapersError('Failed to load paper detail.'));
      } finally {
        if (!canceled) dispatch(setPapersDetailLoading(false));
      }
    };

    void loadDetail();

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, dispatch, selectedPaperId]);

  const importPdf = async (): Promise<void> => {
    if (!activeLibraryRoot) return;

    const candidate = await papersTnetApi.papers.library.selectPdf({
      libraryRoot: activeLibraryRoot,
      directoryPath: selectedDirectoryRelativePath
    });
    if (!candidate) return;

    setImportCandidate(candidate);
    setImportTitle(candidate.suggestedTitle);
  };

  const confirmImportPdf = async (): Promise<void> => {
    if (!activeLibraryRoot || !importCandidate) return;

    const title = importTitle.trim();
    if (!title) return;

    const imported = await papersTnetApi.papers.library.createPaperFromPdf({
      libraryRoot: activeLibraryRoot,
      sourcePath: importCandidate.sourcePath,
      title,
      directoryPath: importCandidate.targetDirectoryPath
    });
    const papers = await papersTnetApi.papers.papers.list({
      libraryRoot: activeLibraryRoot,
      directoryPath: selectedDirectoryRelativePath
    });

    dispatch(setPapers(papers));
    dispatch(selectPaper(imported.id));
    dispatch(setPaperDetail(imported));
    dispatch(setActivePapersDetailTab('pdf'));
    setImportCandidate(null);
    setImportTitle('');
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
      <section className="papers-list-pane" aria-label="Paper list">
        <header className="papers-pane-header">
          <div>
            <h1>Papers</h1>
            <span>
              {selectedDirectoryRelativePath ?? 'All papers'} - {items.length} papers
            </span>
          </div>
          <button className="icon-button" type="button" aria-label="Import PDF" onClick={importPdf}>
            <span className="material-icons-round" aria-hidden="true">
              upload_file
            </span>
          </button>
        </header>
        {error ? <div className="papers-error">{error}</div> : null}
        {isLoadingList ? <div className="papers-empty-state">Loading papers...</div> : null}
        {!isLoadingList && items.length === 0 ? (
          <div className="papers-empty-state">Import a PDF to register a paper.</div>
        ) : null}
        <div className="papers-list">
          {items.map((paper) => (
            <button
              key={paper.id}
              className={`papers-list-item ${paper.id === selectedPaperId ? 'active' : ''}`}
              type="button"
              onClick={() => dispatch(selectPaper(paper.id))}
            >
              <span className="papers-list-title">{paper.title}</span>
              <span className="papers-list-meta">{formatAuthors(paper)}</span>
              <span className="papers-list-footer">
                <span>{paper.publishedYear ?? 'Year unknown'}</span>
                {paper.hasPdf ? (
                  <span className="material-icons-round papers-list-pdf" aria-label="Has PDF">
                    picture_as_pdf
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="papers-detail-pane" aria-label="Paper detail">
        {!selectedPaperId ? <div className="papers-empty-state">Select a paper.</div> : null}
        {selectedPaperId && isLoadingDetail ? (
          <div className="papers-empty-state">Loading paper detail...</div>
        ) : null}
        {detail && !isLoadingDetail ? (
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
                  onClick={() => dispatch(setActivePapersDetailTab(tab))}
                >
                  {tab === 'metadata' ? 'Metadata' : tab === 'pdf' ? 'PDF' : 'Note'}
                </button>
              ))}
            </nav>
            {activeDetailTab === 'metadata' ? (
              <div className="papers-metadata">
                <dl>
                  <dt>Venue</dt>
                  <dd>{detail.venue ?? '-'}</dd>
                  <dt>Year</dt>
                  <dd>{detail.publishedYear ?? '-'}</dd>
                  <dt>DOI</dt>
                  <dd>{detail.doi ?? '-'}</dd>
                  <dt>arXiv</dt>
                  <dd>{detail.arxivId ?? '-'}</dd>
                  <dt>PDF</dt>
                  <dd>{detail.pdfPath ?? '-'}</dd>
                </dl>
              </div>
            ) : null}
            {activeDetailTab === 'pdf' ? (
              <PdfViewer libraryRoot={activeLibraryRoot} pdfPath={detail.pdfPath} />
            ) : null}
            {activeDetailTab === 'note' ? (
              <textarea className="papers-note-editor" value={detail.noteContent} readOnly />
            ) : null}
          </>
        ) : null}
      </section>
      {importCandidate ? (
        <div className="papers-import-backdrop" role="presentation">
          <form
            className="papers-import-dialog"
            aria-label="Import PDF metadata"
            onSubmit={(event) => {
              event.preventDefault();
              confirmImportPdf().catch((importError: unknown) => {
                console.error('Failed to import PDF', importError);
                dispatch(setPapersError('Failed to import PDF.'));
              });
            }}
          >
            <header>
              <h2>Import PDF</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Cancel import"
                onClick={() => setImportCandidate(null)}
              >
                <span className="material-icons-round" aria-hidden="true">
                  close
                </span>
              </button>
            </header>
            <label className="papers-form-field">
              <span>Title</span>
              <input
                value={importTitle}
                autoFocus
                required
                onChange={(event) => setImportTitle(event.target.value)}
              />
            </label>
            <div className="papers-import-paths">
              <span>{importCandidate.willCopy ? 'Copy to library' : 'Register existing file'}</span>
              <code>{importTargetLabel(importCandidate)}</code>
            </div>
            <footer>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setImportCandidate(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={!importTitle.trim()}>
                Import
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </main>
  );
};
