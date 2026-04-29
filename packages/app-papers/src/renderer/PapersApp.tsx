import { useEffect } from 'react';
import type { PaperSummary } from '@tnet/app-papers/shared/paperTypes';
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

export const PapersApp = (): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const { activeLibraryRoot, isRestored } = usePapersSelector((state) => state.papersLibrary);
  const { activeDetailTab, detail, error, isLoadingDetail, isLoadingList, items, selectedPaperId } =
    usePapersSelector((state) => state.papersContent);

  useEffect(() => {
    let canceled = false;

    const loadPapers = async (): Promise<void> => {
      if (!activeLibraryRoot) return;
      dispatch(setPapersListLoading(true));
      dispatch(setPapersError(''));
      try {
        const papers = await papersTnetApi.papers.papers.list({ libraryRoot: activeLibraryRoot });
        if (!canceled) dispatch(setPapers(papers));
      } catch (loadError) {
        console.error('Failed to load papers', loadError);
        if (!canceled) dispatch(setPapersError('論文リストを読み込めませんでした。'));
      } finally {
        if (!canceled) dispatch(setPapersListLoading(false));
      }
    };

    void loadPapers();

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, dispatch]);

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
        if (!canceled) dispatch(setPapersError('論文の詳細を読み込めませんでした。'));
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

    const imported = await papersTnetApi.papers.library.importPdf({
      libraryRoot: activeLibraryRoot
    });
    if (!imported) return;

    const papers = await papersTnetApi.papers.papers.list({ libraryRoot: activeLibraryRoot });
    dispatch(setPapers(papers));
    dispatch(selectPaper(imported.id));
    dispatch(setPaperDetail(imported));
    dispatch(setActivePapersDetailTab('pdf'));
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
            <span>{items.length} papers</span>
          </div>
          <button className="icon-button" type="button" aria-label="Import PDF" onClick={importPdf}>
            <span className="material-icons-round" aria-hidden="true">
              upload_file
            </span>
          </button>
        </header>
        {error ? <div className="papers-error">{error}</div> : null}
        {isLoadingList ? <div className="papers-empty-state">論文リストを読み込み中...</div> : null}
        {!isLoadingList && items.length === 0 ? (
          <div className="papers-empty-state">PDFをインポートしてください。</div>
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
        {!selectedPaperId ? (
          <div className="papers-empty-state">論文を選択してください。</div>
        ) : null}
        {selectedPaperId && isLoadingDetail ? (
          <div className="papers-empty-state">論文の詳細を読み込み中...</div>
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
    </main>
  );
};
