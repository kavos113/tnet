import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPapersLibraryConfig } from '@tnet/app-papers/shared/config';
import papersLibraryReducer, { setPapersLibrary } from './library/librarySlice';
import papersContentReducer from './papers/papersSlice';
import { PapersSidebar } from './PapersSidebar';

const openDirectory = vi.fn();
const getFileTree = vi.fn();
const createDirectory = vi.fn();
const loadLibrary = vi.fn();
const saveGlobal = vi.fn();

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

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory,
        getFileTree
      },
      file: {
        read: vi.fn(),
        openWithDefaultApp: vi.fn(),
        createDirectory
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
          saveGlobal,
          loadLibrary,
          saveLibrary: vi.fn()
        },
        library: {
          selectPdf: vi.fn(),
          createPaperFromPdf: vi.fn(),
          importPdf: vi.fn()
        },
        papers: {
          list: vi.fn(),
          get: vi.fn()
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

describe('PapersSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openDirectory.mockResolvedValue({ rootPath: '/papers/library' });
    getFileTree.mockResolvedValue([]);
    createDirectory.mockResolvedValue(undefined);
    loadLibrary.mockResolvedValue(defaultPapersLibraryConfig());
    saveGlobal.mockResolvedValue(undefined);
    installTnetApi();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens a paper library from the sidebar and persists it', async () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <PapersSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Library' }));

    await waitFor(() => {
      expect(openDirectory).toHaveBeenCalled();
      expect(getFileTree).toHaveBeenCalledWith('/papers/library');
      expect(store.getState().papersLibrary.activeLibraryRoot).toBe('/papers/library');
      expect(saveGlobal).toHaveBeenCalledWith({
        libraryRoots: ['/papers/library'],
        activeLibraryRoot: '/papers/library',
        lastOpenedDirectory: '/papers/library'
      });
    });
  });

  it('switches between registered paper libraries', async () => {
    const store = createStore();
    store.dispatch(
      setPapersLibrary({
        libraryRoots: ['/papers/first', '/papers/second'],
        activeLibraryRoot: '/papers/first'
      })
    );

    render(
      <Provider store={store}>
        <PapersSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Switch to second' }));

    await waitFor(() => {
      expect(loadLibrary).toHaveBeenCalledWith('/papers/second');
      expect(store.getState().papersLibrary.activeLibraryRoot).toBe('/papers/second');
      expect(saveGlobal).toHaveBeenCalledWith({
        libraryRoots: ['/papers/first', '/papers/second'],
        activeLibraryRoot: '/papers/second',
        lastOpenedDirectory: '/papers/second'
      });
    });
  });

  it('shows the active library directory tree and selects a directory', async () => {
    const store = createStore();
    store.dispatch(
      setPapersLibrary({
        libraryRoots: ['/papers/library'],
        activeLibraryRoot: '/papers/library',
        directoryTree: [
          {
            name: 'logic',
            path: '/papers/library/logic',
            isDirectory: true,
            children: [
              {
                name: 'set-theory',
                path: '/papers/library/logic/set-theory',
                isDirectory: true
              },
              {
                name: 'paper.pdf',
                path: '/papers/library/logic/paper.pdf',
                isDirectory: false
              }
            ]
          }
        ]
      })
    );

    render(
      <Provider store={store}>
        <PapersSidebar />
      </Provider>
    );

    expect(screen.getByText('All papers')).toBeInTheDocument();
    expect(screen.getByText('logic')).toBeInTheDocument();
    expect(screen.queryByText('paper.pdf')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('logic'));

    expect(store.getState().papersLibrary.selectedDirectoryPath).toBe('/papers/library/logic');
    expect(screen.getByText('set-theory')).toBeInTheDocument();
  });

  it('creates a root directory with Ctrl+Shift+N', async () => {
    const store = createStore();
    store.dispatch(
      setPapersLibrary({
        libraryRoots: ['/papers/library'],
        activeLibraryRoot: '/papers/library',
        directoryTree: []
      })
    );
    getFileTree.mockResolvedValue([
      {
        name: 'logic',
        path: '/papers/library/logic',
        isDirectory: true
      }
    ]);

    render(
      <Provider store={store}>
        <PapersSidebar />
      </Provider>
    );

    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'logic' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(createDirectory).toHaveBeenCalledWith({
        rootDir: '/papers/library',
        path: 'logic'
      });
      expect(getFileTree).toHaveBeenCalledWith('/papers/library');
      expect(store.getState().papersLibrary.selectedDirectoryPath).toBe('/papers/library/logic');
      expect(screen.getByText('logic')).toBeInTheDocument();
    });
  });

  it('creates a directory under the selected directory with Ctrl+Shift+N', async () => {
    const store = createStore();
    store.dispatch(
      setPapersLibrary({
        libraryRoots: ['/papers/library'],
        activeLibraryRoot: '/papers/library',
        directoryTree: [
          {
            name: 'logic',
            path: '/papers/library/logic',
            isDirectory: true,
            children: []
          }
        ]
      })
    );
    getFileTree.mockResolvedValue([
      {
        name: 'logic',
        path: '/papers/library/logic',
        isDirectory: true,
        children: [
          {
            name: 'set-theory',
            path: '/papers/library/logic/set-theory',
            isDirectory: true
          }
        ]
      }
    ]);

    render(
      <Provider store={store}>
        <PapersSidebar />
      </Provider>
    );

    fireEvent.click(screen.getByText('logic'));
    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'set-theory' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(createDirectory).toHaveBeenCalledWith({
        rootDir: '/papers/library',
        path: 'logic/set-theory'
      });
      expect(store.getState().papersLibrary.selectedDirectoryPath).toBe(
        '/papers/library/logic/set-theory'
      );
      expect(store.getState().papersLibrary.expandedDirectoryPaths).toContain(
        '/papers/library/logic'
      );
      expect(screen.getByText('set-theory')).toBeInTheDocument();
    });
  });
});
