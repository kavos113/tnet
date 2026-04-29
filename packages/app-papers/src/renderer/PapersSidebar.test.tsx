import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPapersLibraryConfig } from '@tnet/app-papers/shared/config';
import papersLibraryReducer, { setPapersLibrary } from './library/librarySlice';
import papersContentReducer from './papers/papersSlice';
import { PapersSidebar } from './PapersSidebar';

const openDirectory = vi.fn();
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
          saveGlobal,
          loadLibrary,
          saveLibrary: vi.fn()
        },
        library: {
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
});
