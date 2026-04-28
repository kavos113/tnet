import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAppStore,
  type AppStore
} from '@tnet/app-markdown/renderer/test/createMarkdownTestStore';
import { setWorkspace } from '@tnet/app-markdown/renderer/workspace/workspaceSlice';
import { useActiveMarkdownWorkspaceApi } from './useActiveMarkdownWorkspaceApi';

const fileRead = vi.fn();
const fileOpenWithDefaultApp = vi.fn();
const fileWrite = vi.fn();
const fileSaveImage = vi.fn();
const fileReadImage = vi.fn();
const keywordLoadIndex = vi.fn();
const keywordGetContent = vi.fn();
const llmGetInlineCompletion = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: fileRead,
        openWithDefaultApp: fileOpenWithDefaultApp,
        write: fileWrite,
        saveImage: fileSaveImage,
        readImage: fileReadImage,
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
        saveGlobal: vi.fn()
      },
      markdown: {
        config: {
          loadProject: vi.fn(),
          saveProject: vi.fn()
        }
      },
      keyword: {
        loadIndex: keywordLoadIndex,
        getContent: keywordGetContent
      },
      llm: {
        getInlineCompletion: llmGetInlineCompletion
      },
      search: {
        rebuild: vi.fn(),
        workspace: vi.fn()
      }
    },
    writable: true
  });
};

const WorkspaceApiProbe = (): React.JSX.Element => {
  const workspaceApi = useActiveMarkdownWorkspaceApi();

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
          workspaceApi.openFile('/workspace/file.pdf').catch(() => undefined);
        }}
      >
        Open External
      </button>
      <button
        type="button"
        onClick={() => {
          workspaceApi
            .savePastedImage({
              preferredName: 'clipboard.png',
              mimeType: 'image/png',
              contentBase64: 'aW1hZ2U='
            })
            .catch(() => undefined);
        }}
      >
        Paste Image
      </button>
      <button
        type="button"
        onClick={() => {
          workspaceApi.readImageDataUrl('image.png').catch(() => undefined);
        }}
      >
        Read Image
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
      <button
        type="button"
        onClick={() => {
          workspaceApi
            .getInlineCompletion('/workspace/note.md', {
              cursorOffset: 5,
              prefix: 'hello',
              suffix: '',
              selectedText: '',
              trigger: 'manual'
            })
            .catch(() => undefined);
        }}
      >
        Inline Completion
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

describe('useActiveMarkdownWorkspaceApi', () => {
  beforeEach(() => {
    fileRead.mockReset();
    fileOpenWithDefaultApp.mockReset();
    fileWrite.mockReset();
    fileSaveImage.mockReset();
    fileReadImage.mockReset();
    keywordLoadIndex.mockReset();
    keywordGetContent.mockReset();
    llmGetInlineCompletion.mockReset();
    fileRead.mockResolvedValue('opened content');
    fileOpenWithDefaultApp.mockResolvedValue(undefined);
    fileSaveImage.mockResolvedValue({ filename: 'paste-clipboard.png' });
    fileReadImage.mockResolvedValue({ dataUrl: 'data:image/png;base64,aW1hZ2U=' });
    keywordLoadIndex.mockResolvedValue({ Keyword: '/workspace/note.md' });
    llmGetInlineCompletion.mockResolvedValue(null);
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

    fireEvent.click(screen.getByRole('button', { name: 'Paste Image' }));
    expect(fileSaveImage).toHaveBeenCalledWith({
      rootDir: '/workspace',
      preferredName: 'clipboard.png',
      mimeType: 'image/png',
      contentBase64: 'aW1hZ2U='
    });

    fireEvent.click(screen.getByRole('button', { name: 'Read Image' }));
    expect(fileReadImage).toHaveBeenCalledWith({
      rootDir: '/workspace',
      filename: 'image.png'
    });

    fireEvent.click(screen.getByRole('button', { name: 'Keyword Content' }));
    expect(keywordGetContent).toHaveBeenCalledWith({
      rootDir: '/workspace',
      path: 'note.md',
      name: 'Keyword'
    });

    fireEvent.click(screen.getByRole('button', { name: 'Inline Completion' }));
    expect(llmGetInlineCompletion).toHaveBeenCalledWith({
      workspaceRoot: '/workspace',
      filePath: 'note.md',
      language: 'markdown',
      cursorOffset: 5,
      prefix: 'hello',
      suffix: '',
      selectedText: '',
      trigger: 'manual'
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    await waitFor(() => {
      expect(fileRead).toHaveBeenCalledWith({ rootDir: '/workspace', path: 'note.md' });
      expect(store.getState().editor.openedFiles[0]).toMatchObject({
        path: '/workspace/note.md',
        content: 'opened content'
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open External' }));
    await waitFor(() => {
      expect(fileOpenWithDefaultApp).toHaveBeenCalledWith({
        rootDir: '/workspace',
        path: 'file.pdf'
      });
    });
    expect(fileRead).toHaveBeenCalledTimes(1);
    expect(store.getState().editor.openedFiles).toHaveLength(1);
  });
});
