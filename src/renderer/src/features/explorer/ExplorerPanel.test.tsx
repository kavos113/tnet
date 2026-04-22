import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@renderer/app/store';
import { setWorkspace } from '@renderer/features/workspace/workspaceSlice';
import { ExplorerPanel } from './ExplorerPanel';

const fileCreate = vi.fn();
const fileCreateDirectory = vi.fn();
const fileDelete = vi.fn();
const fileRead = vi.fn();
const fileRename = vi.fn();
const getFileTree = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree
      },
      file: {
        read: fileRead,
        write: vi.fn(),
        create: fileCreate,
        createDirectory: fileCreateDirectory,
        delete: fileDelete,
        rename: fileRename
      },
      session: {
        load: vi.fn(),
        save: vi.fn()
      },
      config: {
        loadGlobal: vi.fn(),
        saveGlobal: vi.fn(),
        loadProject: vi.fn(),
        saveProject: vi.fn()
      },
      keyword: {
        loadIndex: vi.fn(),
        getContent: vi.fn()
      }
    },
    writable: true
  });
};

const renderExplorer = (): ReturnType<typeof createAppStore> => {
  const store = createAppStore();
  store.dispatch(
    setWorkspace({
      rootPath: '/workspace',
      fileTree: [
        {
          name: 'docs',
          path: '/workspace/docs',
          isDirectory: true,
          children: [{ name: 'note.md', path: '/workspace/docs/note.md', isDirectory: false }]
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
    fileRead.mockResolvedValue('content');
    fileRename.mockResolvedValue(undefined);
    getFileTree.mockResolvedValue([]);
    installTnetApi();
  });

  it('uses the legacy folder icons and spacing for directories and files', () => {
    renderExplorer();

    expect(screen.getByText('chevron_right')).toHaveClass('file-item-chevron');
    expect(screen.getByText('folder')).toHaveClass('file-item-folder');
    expect(screen.getByText('docs')).toHaveClass('file-item-name');

    fireEvent.click(screen.getByText('docs'));

    expect(screen.getByText('folder_open')).toHaveClass('file-item-folder');
    expect(screen.getByText('note.md')).toHaveClass('file-item-not-directory');
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
});
