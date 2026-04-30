import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import papersLibraryReducer, { setPapersLibrary } from '../library/librarySlice';
import papersContentReducer from '../papers/papersSlice';
import { PapersSettingsDialog } from './PapersSettingsDialog';

const loadLibrary = vi.fn();
const saveLibrary = vi.fn();

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
          loadLibrary,
          saveLibrary
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
        tags: {
          list: vi.fn(),
          upsert: vi.fn(),
          attach: vi.fn(),
          detach: vi.fn()
        },
        notes: {
          save: vi.fn()
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

describe('PapersSettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadLibrary.mockResolvedValue({
      listDensity: 'comfortable',
      pdfZoomMode: 'page-width',
      noteEditorMode: 'split',
      noteAutoSaveDebounceMs: 500
    });
    saveLibrary.mockResolvedValue(undefined);
    installTnetApi();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads paper library settings into a draft and saves edited values', async () => {
    const store = createStore();
    store.dispatch(
      setPapersLibrary({
        libraryRoots: ['/papers/library'],
        activeLibraryRoot: '/papers/library'
      })
    );
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <PapersSettingsDialog isOpen={true} onClose={onClose} />
      </Provider>
    );

    await waitFor(() => {
      expect(loadLibrary).toHaveBeenCalledWith('/papers/library');
    });

    fireEvent.change(screen.getByLabelText('Density'), {
      target: { value: 'compact' }
    });
    fireEvent.change(screen.getByLabelText('Default zoom'), {
      target: { value: 'actual-size' }
    });
    fireEvent.change(screen.getByLabelText('Mode'), {
      target: { value: 'editor' }
    });
    fireEvent.change(screen.getByLabelText('Auto save delay (ms)'), {
      target: { value: '1000' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveLibrary).toHaveBeenCalledWith('/papers/library', {
        listDensity: 'compact',
        pdfZoomMode: 'actual-size',
        noteEditorMode: 'editor',
        noteAutoSaveDebounceMs: 1000
      });
      expect(store.getState().papersLibrary.settings).toEqual({
        listDensity: 'compact',
        pdfZoomMode: 'actual-size',
        noteEditorMode: 'editor',
        noteAutoSaveDebounceMs: 1000
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
