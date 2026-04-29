import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaperDetail, PaperSummary } from '@tnet/app-papers/shared/paperTypes';
import papersLibraryReducer, { setPapersLibrary } from './library/librarySlice';
import papersContentReducer from './papers/papersSlice';
import { PapersApp } from './PapersApp';

vi.mock('./papers/PdfViewer', () => ({
  PdfViewer: () => <div data-testid="pdf-viewer" />
}));

const listPapers = vi.fn();
const getPaper = vi.fn();
const selectPdf = vi.fn();
const createPaperFromPdf = vi.fn();

interface PapersTestState {
  papersLibrary: ReturnType<typeof papersLibraryReducer>;
  papersContent: ReturnType<typeof papersContentReducer>;
}

const createStore = (): EnhancedStore<PapersTestState> =>
  configureStore({
    reducer: {
      papersLibrary: papersLibraryReducer,
      papersContent: papersContentReducer
    }
  });

const papers: PaperSummary[] = [
  {
    id: 'paper-1',
    title: 'Lambda Calculus Foundations',
    authors: ['Alonzo Church'],
    publishedYear: 1936,
    venue: 'Annals of Mathematics',
    tags: [],
    hasPdf: true
  },
  {
    id: 'paper-2',
    title: 'Type Theory Notes',
    authors: [],
    tags: [],
    hasPdf: false
  }
];

const paperDetail: PaperDetail = {
  ...papers[0],
  abstract: '',
  doi: '',
  arxivId: '',
  url: '',
  pdfPath: 'papers/lambda.pdf',
  directoryPath: 'logic',
  noteContent: ''
};

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: vi.fn(),
        openWithDefaultApp: vi.fn(),
        createDirectory: vi.fn()
      },
      session: {
        load: vi.fn(),
        save: vi.fn()
      },
      config: {
        loadGlobal: vi.fn(),
        saveGlobal: vi.fn()
      },
      papers: {
        config: {
          loadGlobal: vi.fn(),
          saveGlobal: vi.fn(),
          loadLibrary: vi.fn(),
          saveLibrary: vi.fn()
        },
        library: {
          selectPdf,
          createPaperFromPdf,
          importPdf: vi.fn()
        },
        papers: {
          list: listPapers,
          get: getPaper
        },
        pdf: {
          loadBytes: vi.fn(),
          openExternal: vi.fn()
        }
      }
    },
    writable: true
  });
};

const renderPapersApp = (): EnhancedStore<PapersTestState> => {
  const store = createStore();
  store.dispatch(
    setPapersLibrary({
      libraryRoots: ['/papers/library'],
      activeLibraryRoot: '/papers/library'
    })
  );

  render(
    <Provider store={store}>
      <PapersApp />
    </Provider>
  );

  return store;
};

describe('PapersApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPapers.mockResolvedValue(papers);
    getPaper.mockResolvedValue(paperDetail);
    selectPdf.mockResolvedValue(null);
    createPaperFromPdf.mockResolvedValue(paperDetail);
    installTnetApi();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders papers as a compact table with title, year, and journal columns', async () => {
    renderPapersApp();

    expect(await screen.findByText('Lambda Calculus Foundations')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Year' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByText('1936')).toBeInTheDocument();
    expect(screen.getByText('Annals of Mathematics')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('filters the paper table by title without requesting another list', async () => {
    renderPapersApp();

    expect(await screen.findByText('Lambda Calculus Foundations')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter papers by title' }), {
      target: { value: 'type' }
    });

    expect(screen.queryByText('Lambda Calculus Foundations')).not.toBeInTheDocument();
    expect(screen.getByText('Type Theory Notes')).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 papers/)).toBeInTheDocument();
    expect(listPapers).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when the title filter has no matches', async () => {
    renderPapersApp();

    expect(await screen.findByText('Lambda Calculus Foundations')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter papers by title' }), {
      target: { value: 'category theory' }
    });

    expect(screen.getByText('No papers match the current title filter.')).toBeInTheDocument();
  });

  it('selects a paper from the compact row', async () => {
    const store = renderPapersApp();

    fireEvent.click(await screen.findByRole('row', { name: /Lambda Calculus Foundations/ }));

    await waitFor(() => {
      expect(store.getState().papersContent.selectedPaperId).toBe('paper-1');
      expect(getPaper).toHaveBeenCalledWith({
        libraryRoot: '/papers/library',
        paperId: 'paper-1'
      });
    });
  });

  it('resizes the paper list and preview panes by dragging the separator', async () => {
    renderPapersApp();
    await screen.findByText('Lambda Calculus Foundations');

    const separator = screen.getByRole('separator', { name: 'Resize paper list and preview' });
    const container = separator.parentElement;
    expect(container).not.toBeNull();

    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        width: 500,
        top: 0,
        height: 300,
        right: 600,
        bottom: 300,
        x: 100,
        y: 0,
        toJSON: () => ({})
      })
    });

    fireEvent.mouseDown(separator, { clientX: 300 });
    fireEvent.mouseMove(document, { clientX: 475 });
    fireEvent.mouseUp(document);

    expect(screen.getByLabelText('Paper list')).toHaveStyle({ width: '75%' });
    expect(screen.getByLabelText('Paper detail')).toHaveStyle({ width: '25%' });
  });
});
