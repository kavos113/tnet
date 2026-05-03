import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
          load: vi.fn().mockResolvedValue({}),
          save: vi.fn().mockResolvedValue(undefined)
        },
        config: {
          loadGlobal: vi.fn().mockResolvedValue({}),
          saveGlobal: vi.fn().mockResolvedValue(undefined)
        },
        tasks: {
          config: {
            loadGlobal: vi.fn().mockResolvedValue({}),
            saveGlobal: vi.fn().mockResolvedValue(undefined)
          },
          tasks: {
            list: vi.fn().mockResolvedValue([]),
            save: vi.fn(),
            complete: vi.fn(),
            remove: vi.fn()
          },
          categories: {
            list: vi.fn().mockResolvedValue([])
          },
          calendarSources: {
            list: vi.fn().mockResolvedValue([]),
            save: vi.fn(),
            remove: vi.fn(),
            authorizeGoogle: vi.fn()
          },
          calendarOccurrences: {
            list: vi.fn().mockResolvedValue([])
          },
          subscribedTaskOccurrences: {
            list: vi.fn().mockResolvedValue([])
          },
          localEvents: {
            list: vi.fn().mockResolvedValue([]),
            save: vi.fn(),
            remove: vi.fn()
          },
          sync: {
            manual: vi.fn()
          },
          secrets: {
            has: vi.fn()
          }
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
            listHistory: vi.fn(),
            listTabs: vi.fn().mockResolvedValue([]),
            saveTab: vi.fn(),
            closeTab: vi.fn()
          },
          files: {
            selectSqliteDatabase: vi.fn(),
            saveTextFile: vi.fn()
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

    expect(await screen.findByRole('main', { name: 'Tasks' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Task title')).toBeInTheDocument();
    expect(screen.getByText('Open Tasks')).toBeInTheDocument();
  });

  it('saves common font settings from the settings center', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    await screen.findByRole('main', { name: 'Tasks' });
    fireEvent.keyDown(document, { key: ',', ctrlKey: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Fonts' }));
    const familyInputs = screen.getAllByLabelText('Font family');
    const sizeInputs = screen.getAllByLabelText('Font size (px)');
    fireEvent.change(familyInputs[0], { target: { value: 'Inter' } });
    fireEvent.change(sizeInputs[0], { target: { value: '14' } });
    fireEvent.change(familyInputs[1], { target: { value: 'JetBrains Mono' } });
    fireEvent.change(sizeInputs[1], { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(window.tnet.config.saveGlobal).toHaveBeenCalledWith(
        expect.objectContaining({
          fonts: {
            standardFontFamily: 'Inter',
            standardFontSize: 14,
            monospaceFontFamily: 'JetBrains Mono',
            monospaceFontSize: 15
          }
        })
      )
    );
  });

  it('falls back to Tasks when the stored active app is invalid', async () => {
    vi.mocked(window.tnet.config.loadGlobal).mockResolvedValueOnce({
      activeAppId: 'missing-app' as never
    });

    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    expect(await screen.findByRole('main', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('switches apps from the Tasks portal shortcuts', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    const shortcuts = await screen.findByLabelText('App shortcuts');
    fireEvent.click(within(shortcuts).getByRole('button', { name: 'Markdown' }));

    expect(await screen.findByText('No file selected', {}, { timeout: 5000 })).toBeInTheDocument();
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

    expect(await screen.findByRole('main', { name: 'Papers' })).toBeInTheDocument();
    expect(screen.queryByText('No folder selected')).not.toBeInTheDocument();
    expect(getFileTree).not.toHaveBeenCalled();
    expect(sessionLoad).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Code' }));

    expect(await screen.findByRole('main', { name: 'Code' })).toBeInTheDocument();
    expect(screen.queryByText('No folder selected')).not.toBeInTheDocument();
    expect(getFileTree).not.toHaveBeenCalled();
    expect(sessionLoad).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Markdown' }));

    expect(await screen.findByText('No file selected', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('opens the requester app module from the app rail', async () => {
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Requester' }));

    expect(await screen.findByRole('main', { name: 'Requester' })).toBeInTheDocument();
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

    expect(await screen.findByRole('main', { name: 'DB Inspector' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Select a table from the schema tree.')).toBeInTheDocument();
    });
  });

  it('opens the PDF Viewer app module and restores its configured workspace', async () => {
    vi.mocked(window.tnet.config.loadGlobal).mockResolvedValue({
      apps: {
        'pdf-viewer': {
          workspaceRoots: ['C:/workspace/pdfs'],
          activeWorkspaceRoot: 'C:/workspace/pdfs'
        }
      }
    });
    vi.mocked(window.tnet.workspace.getFileTree).mockResolvedValue([
      {
        name: '0407.pdf',
        path: 'C:/workspace/pdfs/0407.pdf',
        isDirectory: false
      }
    ]);

    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'PDF Viewer' }));

    expect(await screen.findByRole('main', { name: 'PDF Viewer' })).toBeInTheDocument();
    await waitFor(() => {
      expect(window.tnet.workspace.getFileTree).toHaveBeenCalledWith('C:/workspace/pdfs');
    });
    expect(await screen.findByText('pdfs')).toBeInTheDocument();
  });
});
