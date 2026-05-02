import { describe, expect, it } from 'vitest';
import reducer, {
  openPdf,
  requestPageNavigation,
  setActivePage,
  setDocumentPageCount,
  setPdfViewerSidebarPanel
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
});
