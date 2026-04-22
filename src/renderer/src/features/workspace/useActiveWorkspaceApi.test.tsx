import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore, type AppStore } from '@renderer/app/store';
import { setWorkspace } from './workspaceSlice';
import { useActiveWorkspaceApi } from './useActiveWorkspaceApi';

const fileRead = vi.fn();
const fileWrite = vi.fn();
const keywordLoadIndex = vi.fn();
const keywordGetContent = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: fileRead,
        write: fileWrite,
        create: vi.fn(),
        createDirectory: vi.fn(),
        delete: vi.fn(),
        rename: vi.fn()
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
        loadIndex: keywordLoadIndex,
        getContent: keywordGetContent
      }
    },
    writable: true
  });
};

const WorkspaceApiProbe = (): React.JSX.Element => {
  const workspaceApi = useActiveWorkspaceApi();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          workspaceApi.writeFile('/workspace/note.md', 'draft').catch(() => undefined);
        }}
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          workspaceApi.openFile('/workspace/note.md').catch(() => undefined);
        }}
      >
        Open
      </button>
      <button
        type="button"
        onClick={() => {
          workspaceApi.loadKeywordIndex().catch(() => undefined);
        }}
      >
        Keywords
      </button>
      <button
        type="button"
        onClick={() => {
          workspaceApi.getKeywordContent('/workspace/note.md', 'Keyword').catch(() => undefined);
        }}
      >
        Keyword Content
      </button>
    </div>
  );
};

const renderProbe = (store: AppStore): void => {
  render(
    <Provider store={store}>
      <WorkspaceApiProbe />
    </Provider>
  );
};

describe('useActiveWorkspaceApi', () => {
  beforeEach(() => {
    fileRead.mockReset();
    fileWrite.mockReset();
    keywordLoadIndex.mockReset();
    keywordGetContent.mockReset();
    fileRead.mockResolvedValue('opened content');
    keywordLoadIndex.mockResolvedValue({ Keyword: '/workspace/note.md' });
    installTnetApi();
  });

  it('keeps rootPath inside the workspace-aware hook for file and keyword operations', async () => {
    const store = createAppStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    renderProbe(store);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(fileWrite).toHaveBeenCalledWith({
      rootDir: '/workspace',
      path: 'note.md',
      content: 'draft'
    });

    fireEvent.click(screen.getByRole('button', { name: 'Keywords' }));
    expect(keywordLoadIndex).toHaveBeenCalledWith('/workspace');

    fireEvent.click(screen.getByRole('button', { name: 'Keyword Content' }));
    expect(keywordGetContent).toHaveBeenCalledWith({
      rootDir: '/workspace',
      path: 'note.md',
      name: 'Keyword'
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    await waitFor(() => {
      expect(fileRead).toHaveBeenCalledWith({ rootDir: '/workspace', path: 'note.md' });
      expect(store.getState().editor.openedFiles[0]).toMatchObject({
        path: '/workspace/note.md',
        content: 'opened content'
      });
    });
  });
});
