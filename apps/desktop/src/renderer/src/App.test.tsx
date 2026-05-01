import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { App } from './App';
import { createAppStore } from './app/store';

describe('App', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'tnet', {
      value: {
        workspace: {
          openDirectory: vi.fn(),
          getFileTree: vi.fn().mockResolvedValue([])
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
          loadGlobal: vi.fn().mockResolvedValue({}),
          saveGlobal: vi.fn().mockResolvedValue(undefined)
        },
        markdown: {
          config: {
            loadProject: vi.fn(),
            saveProject: vi.fn()
          },
          file: {
            write: vi.fn(),
            saveImage: vi.fn(),
            readImage: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            rename: vi.fn()
          },
          keyword: {
            loadIndex: vi.fn(),
            getContent: vi.fn()
          },
          search: {
            rebuild: vi.fn(),
            workspace: vi.fn()
          },
          llm: {
            getInlineCompletion: vi.fn()
          }
        },
        papers: {
          config: {
            loadGlobal: vi.fn().mockResolvedValue({ libraryRoots: [] }),
            saveGlobal: vi.fn().mockResolvedValue(undefined),
            loadLibrary: vi.fn(),
            saveLibrary: vi.fn()
          },
          library: {
            selectPdf: vi.fn(),
            createPaperFromPdf: vi.fn(),
            createPaperFromPdfBytes: vi.fn(),
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
        },
        requester: {
          config: {
            loadGlobal: vi.fn().mockResolvedValue({}),
            saveGlobal: vi.fn().mockResolvedValue(undefined)
          },
          workspaces: {
            list: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            getSettings: vi.fn(),
            saveSettings: vi.fn()
          },
          requests: {
            list: vi.fn().mockResolvedValue([]),
            get: vi.fn(),
            save: vi.fn(),
            duplicate: vi.fn(),
            rename: vi.fn(),
            reorder: vi.fn(),
            remove: vi.fn()
          },
          variableSets: {
            list: vi.fn(),
            save: vi.fn(),
            remove: vi.fn(),
            setActive: vi.fn()
          },
          execution: {
            send: vi.fn(),
            abort: vi.fn()
          },
          history: {
            list: vi.fn(),
            get: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn()
          },
          files: {
            selectBinaryBody: vi.fn(),
            saveResponseBody: vi.fn(),
            openResponseExternally: vi.fn()
          },
          graphql: {
            introspect: vi.fn()
          }
        },
        dbInspector: {
          config: {
            loadGlobal: vi.fn().mockResolvedValue({}),
            saveGlobal: vi.fn().mockResolvedValue(undefined)
          },
          workspaces: {
            list: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            getSettings: vi.fn(),
            saveSettings: vi.fn(),
            testConnection: vi.fn()
          },
          schema: {
            refresh: vi.fn(),
            getTree: vi.fn()
          },
          tableData: {
            loadPage: vi.fn()
          },
          query: {
            execute: vi.fn(),
            listHistory: vi.fn()
          },
          files: {
            selectSqliteDatabase: vi.fn()
          }
        }
      },
      writable: true
    });
  });

  it('renders the React shell', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    expect(await screen.findByText('No folder selected')).toBeInTheDocument();
    expect(screen.getByText('Open Folder')).toBeInTheDocument();
    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });

  it('switches between app modules from the app rail', async () => {
    const getFileTree = vi.mocked(window.tnet.workspace.getFileTree);
    const sessionLoad = vi.mocked(window.tnet.session.load);
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Papers' }));

    expect(screen.getByRole('main', { name: 'Papers' })).toBeInTheDocument();
    expect(screen.queryByText('No folder selected')).not.toBeInTheDocument();
    expect(getFileTree).not.toHaveBeenCalled();
    expect(sessionLoad).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Code' }));

    expect(screen.getByRole('main', { name: 'Code' })).toBeInTheDocument();
    expect(screen.queryByText('No folder selected')).not.toBeInTheDocument();
    expect(getFileTree).not.toHaveBeenCalled();
    expect(sessionLoad).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Markdown' }));

    await waitFor(() => {
      expect(screen.getByText('No file selected')).toBeInTheDocument();
    });
  });

  it('opens the requester app module from the app rail', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Requester' }));

    expect(screen.getByRole('main', { name: 'Requester' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Create a request workspace to begin.')).toBeInTheDocument();
    });
  });

  it('opens the DB Inspector app module from the app rail', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'DB Inspector' }));

    expect(screen.getByRole('main', { name: 'DB Inspector' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Select a table from the schema tree.')).toBeInTheDocument();
    });
  });
});
