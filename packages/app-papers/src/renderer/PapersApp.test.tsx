import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@tnet/markdown-editor/renderer', () => ({
  MarkdownEditorSurface: ({
    content,
    onChange
  }: {
    content: string;
    onChange: (content: string) => void;
  }) => (
    <textarea
      aria-label="Paper note"
      value={content}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  )
}));

const listPapers = vi.fn();
const getPaper = vi.fn();
const selectPdf = vi.fn();
const createPaperFromPdf = vi.fn();
const listTags = vi.fn();
const upsertTag = vi.fn();
const attachTag = vi.fn();
const detachTag = vi.fn();
const saveNote = vi.fn();

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
    tags: ['logic'],
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
        tags: {
          list: listTags,
          upsert: upsertTag,
          attach: attachTag,
          detach: detachTag
        },
        notes: {
          save: saveNote
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
    listTags.mockResolvedValue([{ id: 'tag-1', name: 'logic' }]);
    upsertTag.mockResolvedValue({ id: 'tag-2', name: 'semantics' });
    attachTag.mockResolvedValue({ ...paperDetail, tags: ['logic', 'semantics'] });
    detachTag.mockResolvedValue({ ...paperDetail, tags: [] });
    saveNote.mockResolvedValue({ ...paperDetail, noteContent: '# Updated note' });
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
    expect(screen.getByRole('columnheader', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByText('1936')).toBeInTheDocument();
    expect(screen.getByText('Annals of Mathematics')).toBeInTheDocument();
    expect(screen.getAllByText('logic')).toHaveLength(2);
  });

  it('requests paper search through IPC', async () => {
    renderPapersApp();

    expect(await screen.findByText('Lambda Calculus Foundations')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search papers' }), {
      target: { value: 'type' }
    });

    await waitFor(() => {
      expect(listPapers).toHaveBeenLastCalledWith({
        libraryRoot: '/papers/library',
        directoryPath: undefined,
        query: 'type',
        tagIds: []
      });
    });
  });

  it('combines tag filter with paper search', async () => {
    renderPapersApp();

    expect(await screen.findByText('Lambda Calculus Foundations')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search papers' }), {
      target: { value: 'lambda' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'logic' }));

    await waitFor(() => {
      expect(listPapers).toHaveBeenLastCalledWith({
        libraryRoot: '/papers/library',
        directoryPath: undefined,
        query: 'lambda',
        tagIds: ['tag-1']
      });
    });
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

  it('creates and attaches tags from the metadata tab', async () => {
    renderPapersApp();

    fireEvent.click(await screen.findByRole('row', { name: /Lambda Calculus Foundations/ }));
    await screen.findByTestId('pdf-viewer');
    fireEvent.click(screen.getByRole('button', { name: 'Metadata' }));

    fireEvent.change(screen.getByRole('textbox', { name: 'New paper tag' }), {
      target: { value: 'semantics' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add paper tag' }));

    await waitFor(() => {
      expect(upsertTag).toHaveBeenCalledWith({
        libraryRoot: '/papers/library',
        name: 'semantics'
      });
      expect(attachTag).toHaveBeenCalledWith({
        libraryRoot: '/papers/library',
        paperId: 'paper-1',
        tagId: 'tag-2'
      });
    });
  });

  it('auto-saves paper notes through IPC', async () => {
    renderPapersApp();

    fireEvent.click(await screen.findByRole('row', { name: /Lambda Calculus Foundations/ }));
    await screen.findByTestId('pdf-viewer');
    fireEvent.click(screen.getByRole('button', { name: 'Note' }));

    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByRole('textbox', { name: 'Paper note' }), {
        target: { value: '# Updated note' }
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    } finally {
      vi.useRealTimers();
    }

    expect(saveNote).toHaveBeenCalledWith({
      libraryRoot: '/papers/library',
      paperId: 'paper-1',
      content: '# Updated note'
    });
  });

  it('supports paper app shortcuts for search, import, and detail tabs', async () => {
    const store = renderPapersApp();

    await screen.findByText('Lambda Calculus Foundations');

    fireEvent.keyDown(window, { key: 'f', ctrlKey: true });
    expect(screen.getByRole('textbox', { name: 'Search papers' })).toHaveFocus();

    fireEvent.keyDown(window, { key: 'i', ctrlKey: true });
    expect(selectPdf).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('row', { name: /Lambda Calculus Foundations/ }));
    await waitFor(() => {
      expect(store.getState().papersContent.selectedPaperId).toBe('paper-1');
    });

    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    expect(store.getState().papersContent.activeDetailTab).toBe('metadata');
    fireEvent.keyDown(window, { key: '3', ctrlKey: true });
    expect(store.getState().papersContent.activeDetailTab).toBe('note');
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
