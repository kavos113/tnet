import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';
import pdfViewerReducer, {
  openPdf,
  setActivePage,
  setDocumentPageCount,
  setWorkspace
} from './state/pdfViewerSlice';
import { PdfViewerSidebar } from './PdfViewerSidebar';

const createStore = () =>
  configureStore({
    reducer: {
      pdfViewer: pdfViewerReducer
    }
  });

describe('PdfViewerSidebar', () => {
  afterEach(() => cleanup());

  it('keeps workspace directories collapsed until the user opens them', () => {
    const store = createStore();
    store.dispatch(
      setWorkspace({
        rootPath: '/workspace',
        workspaceRoots: ['/workspace'],
        fileTree: [
          {
            name: 'docs',
            path: '/workspace/docs',
            isDirectory: true,
            children: [{ name: 'guide.pdf', path: '/workspace/docs/guide.pdf', isDirectory: false }]
          }
        ]
      })
    );

    render(
      <Provider store={store}>
        <PdfViewerSidebar />
      </Provider>
    );

    expect(screen.queryByText('guide.pdf')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('docs'));

    expect(screen.getByText('guide.pdf')).toBeInTheDocument();
  });

  it('switches sidebar document panels and shows the active page', () => {
    const store = createStore();
    store.dispatch(
      setWorkspace({ rootPath: '/workspace', workspaceRoots: ['/workspace'], fileTree: [] })
    );
    store.dispatch(openPdf({ path: 'guide.pdf' }));
    store.dispatch(setDocumentPageCount({ path: 'guide.pdf', pageCount: 12 }));
    store.dispatch(setActivePage({ path: 'guide.pdf', pageNumber: 4 }));

    render(
      <Provider store={store}>
        <PdfViewerSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Outline' }));

    expect(store.getState().pdfViewer.activeSidebarPanel).toBe('outline');
    expect(screen.getByRole('region', { name: 'PDF Outline' })).toBeInTheDocument();
    expect(screen.getByText('Page 4 / 12')).toBeInTheDocument();
  });

  it('shows an empty state for document panels when no PDF is open', () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <PdfViewerSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Search' }));

    expect(screen.getByText('Open a PDF to use Search.')).toBeInTheDocument();
  });
});
