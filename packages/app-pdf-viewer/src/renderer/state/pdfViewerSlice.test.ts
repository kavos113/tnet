import { describe, expect, it } from 'vitest';
import reducer, {
  closePdf,
  openPdf,
  renameOpenedPdfPath,
  replaceSession,
  requestPageNavigation,
  setActivePage,
  setDocumentError,
  setDocumentPageCount,
  setFileTree,
  setPdfViewerError,
  setPdfViewerSettings,
  setPdfViewerSidebarPanel,
  setWorkspace,
  setWorkspaceRoots,
  switchPdf,
  updateActiveViewState
} from './pdfViewerSlice';

describe('pdfViewerSlice', () => {
  it('stores the active sidebar panel', () => {
    const state = reducer(undefined, setPdfViewerSidebarPanel('search'));

    expect(state.activeSidebarPanel).toBe('search');
  });

  it('creates serializable page navigation requests', () => {
    const state = reducer(
      undefined,
      requestPageNavigation({ path: 'paper.pdf', pageNumber: 3, source: 'outline' })
    );

    expect(state.navigationRequest).toEqual({
      requestId: 1,
      path: 'paper.pdf',
      pageNumber: 3,
      source: 'outline'
    });
  });

  it('tracks active pages within the known document page count', () => {
    let state = reducer(undefined, openPdf({ path: 'paper.pdf' }));
    state = reducer(state, setDocumentPageCount({ path: 'paper.pdf', pageCount: 5 }));
    state = reducer(state, setActivePage({ path: 'paper.pdf', pageNumber: 9 }));

    expect(state.activePageByPath['paper.pdf']).toBe(5);
  });

  it('deduplicates workspace roots and stores file trees', () => {
    let state = reducer(undefined, setWorkspaceRoots(['C:/pdfs', '', 'C:/pdfs', 'D:/papers']));
    state = reducer(
      state,
      setWorkspace({
        rootPath: 'E:/library',
        workspaceRoots: ['D:/papers', 'E:/library'],
        fileTree: [{ name: 'paper.pdf', path: 'E:/library/paper.pdf', isDirectory: false }]
      })
    );
    state = reducer(state, setFileTree([]));

    expect(state.workspaceRoots).toEqual(['D:/papers', 'E:/library']);
    expect(state.fileTree).toEqual([]);
  });

  it('opens existing tabs, switches, closes, and clamps active tab index', () => {
    let state = reducer(undefined, openPdf({ path: 'a.pdf' }));
    state = reducer(state, openPdf({ path: 'b.pdf' }));
    state = reducer(state, switchPdf(0));
    state = reducer(state, switchPdf(99));
    state = reducer(state, openPdf({ path: 'b.pdf' }));
    state = reducer(state, closePdf(99));
    state = reducer(state, closePdf(1));

    expect(state.tabs).toEqual(['a.pdf']);
    expect(state.activeIndex).toBe(0);
    expect(state.documentsByPath['b.pdf']).toBeUndefined();

    state = reducer(state, closePdf(0));
    expect(state.activeIndex).toBe(-1);
  });

  it('renames open document paths with view state and page state', () => {
    let state = reducer(undefined, openPdf({ path: 'old.pdf', viewState: { customScale: 1.5 } }));
    state = reducer(state, setActivePage({ path: 'old.pdf', pageNumber: 4 }));
    state = reducer(state, renameOpenedPdfPath({ oldPath: 'old.pdf', newPath: 'new.pdf' }));

    expect(state.tabs).toEqual(['new.pdf']);
    expect(state.documentsByPath['new.pdf']).toMatchObject({
      path: 'new.pdf',
      displayName: 'new.pdf'
    });
    expect(state.viewStateByPath['new.pdf'].customScale).toBe(1.5);
    expect(state.activePageByPath['new.pdf']).toBe(4);
    expect(state.documentsByPath['old.pdf']).toBeUndefined();
  });

  it('replaces sessions and ignores active view updates without an active tab', () => {
    let state = reducer(
      undefined,
      replaceSession({
        openedFiles: ['a.pdf', 'b.pdf'],
        activeIndex: 99,
        viewStateByPath: {
          'a.pdf': {
            zoomMode: 'page-width',
            customScale: 1,
            scrollTop: 0,
            columns: 1
          }
        }
      })
    );
    state = reducer(state, updateActiveViewState({ customScale: 2 }));

    expect(state.activeIndex).toBe(1);
    expect(state.viewStateByPath['b.pdf'].customScale).toBe(2);

    state = reducer(state, closePdf(1));
    state = reducer(state, closePdf(0));
    state = reducer(state, updateActiveViewState({ customScale: 3 }));
    expect(state.viewStateByPath).toEqual({
      'a.pdf': {
        zoomMode: 'page-width',
        customScale: 1,
        scrollTop: 0,
        columns: 1
      },
      'b.pdf': {
        zoomMode: 'page-width',
        customScale: 2,
        scrollTop: 0,
        columns: 1
      }
    });
  });

  it('stores settings and document errors', () => {
    let state = reducer(undefined, setPdfViewerError('workspace failed'));
    state = reducer(state, setPdfViewerSettings({ ...state.settings, defaultColumns: 2 }));
    state = reducer(state, openPdf({ path: 'paper.pdf' }));
    state = reducer(state, setDocumentError({ path: 'paper.pdf', error: 'load failed' }));
    state = reducer(state, setDocumentError({ path: 'missing.pdf', error: 'ignored' }));

    expect(state.error).toBe('workspace failed');
    expect(state.settings.defaultColumns).toBe(2);
    expect(state.documentsByPath['paper.pdf'].error).toBe('load failed');
    expect(state.documentsByPath['missing.pdf']).toBeUndefined();
  });

  it('rounds low page numbers and increments navigation requests', () => {
    let state = reducer(
      undefined,
      requestPageNavigation({ path: 'paper.pdf', pageNumber: -3.2, source: 'search' })
    );
    state = reducer(
      state,
      requestPageNavigation({ path: 'paper.pdf', pageNumber: 2.6, source: 'thumbnails' })
    );

    expect(state.navigationRequest).toMatchObject({
      requestId: 2,
      pageNumber: 3,
      source: 'thumbnails'
    });
  });
});
