import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGlobalConfig, defaultProjectConfig } from '@shared/types/config';
import { createAppStore } from '@renderer/app/store';
import { setWorkspace } from '@renderer/features/workspace/workspaceSlice';
import { ExplorerPanel } from './ExplorerPanel';

const fileCreate = vi.fn();
const fileCreateDirectory = vi.fn();
const fileDelete = vi.fn();
const fileOpenWithDefaultApp = vi.fn();
const fileRead = vi.fn();
const fileRename = vi.fn();
const getFileTree = vi.fn();
const loadProject = vi.fn();
const openDirectory = vi.fn();
const loadGlobal = vi.fn();
const saveGlobal = vi.fn();
const searchRebuild = vi.fn();
const searchWorkspace = vi.fn();
const sessionLoad = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory,
        getFileTree
      },
      file: {
        read: fileRead,
        openWithDefaultApp: fileOpenWithDefaultApp,
        write: vi.fn(),
        create: fileCreate,
        createDirectory: fileCreateDirectory,
        delete: fileDelete,
        rename: fileRename
      },
      session: {
        load: sessionLoad,
        save: vi.fn()
      },
      config: {
        loadGlobal,
        saveGlobal,
        loadProject,
        saveProject: vi.fn()
      },
      keyword: {
        loadIndex: vi.fn(),
        getContent: vi.fn()
      },
      search: {
        rebuild: searchRebuild,
        workspace: searchWorkspace
      },
      llm: {
        getInlineCompletion: vi.fn()
      }
    },
    writable: true
  });
};

const renderExplorer = (workspaceRoots?: string[]): ReturnType<typeof createAppStore> => {
  const store = createAppStore();
  store.dispatch(
    setWorkspace({
      rootPath: '/workspace',
      workspaceRoots,
      fileTree: [
        {
          name: 'docs',
          path: '/workspace/docs',
          isDirectory: true,
          children: [{ name: 'note.md', path: '/workspace/docs/note.md', isDirectory: false }]
        },
        {
          name: 'paper.pdf',
          path: '/workspace/paper.pdf',
          isDirectory: false
        }
      ]
    })
  );

  render(
    <Provider store={store}>
      <ExplorerPanel />
    </Provider>
  );

  return store;
};

describe('ExplorerPanel', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fileCreate.mockResolvedValue(undefined);
    fileCreateDirectory.mockResolvedValue(undefined);
    fileDelete.mockResolvedValue(undefined);
    fileOpenWithDefaultApp.mockResolvedValue(undefined);
    fileRead.mockResolvedValue('content');
    fileRename.mockResolvedValue(undefined);
    getFileTree.mockResolvedValue([]);
    loadProject.mockResolvedValue(defaultProjectConfig());
    openDirectory.mockResolvedValue({ rootPath: '' });
    loadGlobal.mockResolvedValue(defaultGlobalConfig());
    saveGlobal.mockResolvedValue(undefined);
    searchRebuild.mockResolvedValue({ indexedFileCount: 0, indexedLineCount: 0 });
    searchWorkspace.mockResolvedValue({
      status: 'ready',
      files: [],
      totalMatches: 0,
      truncated: false,
      indexedFileCount: 0,
      indexedLineCount: 0
    });
    sessionLoad.mockResolvedValue({ openedFiles: [], expandedFolders: [] });
    installTnetApi();
  });

  it('uses the legacy folder icons and spacing for directories and files', () => {
    renderExplorer();

    expect(screen.getByText('chevron_right')).toHaveClass('file-item-chevron');
    expect(
      screen.getAllByText('folder').some((item) => item.classList.contains('file-item-folder'))
    ).toBe(true);
    expect(screen.getByText('docs')).toHaveClass('file-item-name');

    fireEvent.click(screen.getByText('docs'));

    expect(screen.getByText('folder_open')).toHaveClass('file-item-folder');
    expect(screen.getByText('note.md')).toHaveClass('file-item-not-directory');
  });

  it('opens non-markdown files with the OS default application', async () => {
    renderExplorer();

    fireEvent.click(screen.getByText('paper.pdf'));

    await waitFor(() => {
      expect(fileOpenWithDefaultApp).toHaveBeenCalledWith({
        rootDir: '/workspace',
        path: 'paper.pdf'
      });
    });
    expect(fileRead).not.toHaveBeenCalledWith({ rootDir: '/workspace', path: 'paper.pdf' });
  });

  it('creates a root markdown file with Ctrl+N using the legacy inline input', async () => {
    renderExplorer();

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('New File');

    fireEvent.change(input, { target: { value: 'Created' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(fileCreate).toHaveBeenCalledWith({ rootDir: '/workspace', path: 'Created.md' });
      expect(fileRead).toHaveBeenCalledWith({ rootDir: '/workspace', path: 'Created.md' });
      expect(getFileTree).toHaveBeenCalledWith('/workspace');
    });
  });

  it('creates a folder with Ctrl+Shift+N under the selected directory', async () => {
    renderExplorer();

    fireEvent.click(screen.getByText('docs'));
    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('New Folder');
    expect(
      screen.getAllByText('folder').some((item) => item.classList.contains('file-item-folder'))
    ).toBe(true);

    fireEvent.change(input, { target: { value: 'nested' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(fileCreateDirectory).toHaveBeenCalledWith({
        rootDir: '/workspace',
        path: 'docs/nested'
      });
      expect(getFileTree).toHaveBeenCalledWith('/workspace');
    });
  });

  it('renames the selected item with Alt+Shift+R using inline input', async () => {
    renderExplorer();

    fireEvent.click(screen.getByText('docs'));
    fireEvent.click(screen.getByText('note.md'));
    fireEvent.keyDown(window, { key: 'R', altKey: true, shiftKey: true });

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('note.md');

    fireEvent.change(input, { target: { value: 'renamed.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(fileRename).toHaveBeenCalledWith({
        rootDir: '/workspace',
        oldPath: 'docs/note.md',
        newPath: 'docs/renamed.md'
      });
    });
  });

  it('renders workspace switcher entries and switches the active workspace', async () => {
    getFileTree.mockResolvedValue([
      { name: 'second.md', path: '/second/second.md', isDirectory: false }
    ]);
    const store = renderExplorer(['/workspace', '/second']);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to second' }));

    await waitFor(() => {
      expect(store.getState().workspace.rootPath).toBe('/second');
      expect(getFileTree).toHaveBeenCalledWith('/second');
      expect(saveGlobal).toHaveBeenCalledWith({
        activeAppId: 'markdown',
        apps: {
          markdown: {
            lastOpenedDirectory: '/second',
            activeWorkspaceRoot: '/second',
            workspaceRoots: ['/workspace', '/second']
          },
          papers: {},
          code: {}
        }
      });
    });
    expect(screen.getByText('second.md')).toBeInTheDocument();
  });

  it('restores only markdown files when switching workspaces', async () => {
    getFileTree.mockResolvedValue([
      { name: 'second.md', path: '/second/second.md', isDirectory: false }
    ]);
    sessionLoad.mockResolvedValue({
      openedFiles: ['/second/second.md', '/second/reference.pdf'],
      expandedFolders: []
    });
    const store = renderExplorer(['/workspace', '/second']);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to second' }));

    await waitFor(() => {
      expect(fileRead).toHaveBeenCalledWith({ rootDir: '/second', path: 'second.md' });
      expect(fileRead).not.toHaveBeenCalledWith({ rootDir: '/second', path: 'reference.pdf' });
      expect(store.getState().editor.openedFiles.map((file) => file.path)).toEqual([
        '/second/second.md'
      ]);
    });
  });

  it('adds an opened folder to the workspace switcher', async () => {
    openDirectory.mockResolvedValue({ rootPath: '/second' });
    getFileTree.mockResolvedValue([
      { name: 'second.md', path: '/second/second.md', isDirectory: false }
    ]);
    const store = renderExplorer(['/workspace']);

    fireEvent.click(screen.getByRole('button', { name: 'Open workspace' }));

    await waitFor(() => {
      expect(openDirectory).toHaveBeenCalled();
      expect(store.getState().workspace.workspaceRoots).toEqual(['/workspace', '/second']);
      expect(store.getState().workspace.rootPath).toBe('/second');
      expect(saveGlobal).toHaveBeenCalledWith({
        activeAppId: 'markdown',
        apps: {
          markdown: {
            lastOpenedDirectory: '/second',
            activeWorkspaceRoot: '/second',
            workspaceRoots: ['/workspace', '/second']
          },
          papers: {},
          code: {}
        }
      });
    });
  });

  it('opens search with Ctrl+Shift+F and opens the selected result', async () => {
    searchWorkspace.mockResolvedValue({
      status: 'ready',
      files: [
        {
          path: '/workspace/docs/note.md',
          relativePath: 'docs/note.md',
          matches: [
            {
              lineNumber: 3,
              lineText: 'A theorem appears here',
              ranges: [{ start: 2, end: 9 }]
            }
          ]
        }
      ],
      totalMatches: 1,
      truncated: false,
      indexedFileCount: 1,
      indexedLineCount: 1
    });
    renderExplorer();

    fireEvent.keyDown(document, { key: 'F', ctrlKey: true, shiftKey: true });
    const input = screen.getByPlaceholderText('Search');
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.change(input, { target: { value: 'theorem' } });

    await waitFor(() => {
      expect(searchWorkspace).toHaveBeenCalledWith({ rootDir: '/workspace', query: 'theorem' });
      expect(screen.getByText('docs/note.md')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /3 A theorem appears here/ }));

    await waitFor(() => {
      expect(fileRead).toHaveBeenCalledWith({ rootDir: '/workspace', path: 'docs/note.md' });
    });
  });
});
