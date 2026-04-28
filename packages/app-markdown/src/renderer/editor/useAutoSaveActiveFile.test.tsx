import { act, cleanup, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@tnet/app-markdown/renderer/test/createMarkdownTestStore';
import { setSettings, setWorkspace } from '@tnet/app-markdown/renderer/workspace/workspaceSlice';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { openFile, updateActiveContent } from './editorSlice';
import { useAutoSaveActiveFile } from './useAutoSaveActiveFile';
import { useSaveActiveFile } from './useSaveActiveFile';

const writeFile = vi.fn();
const readFile = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: readFile,
        openWithDefaultApp: vi.fn(),
        write: writeFile,
        create: vi.fn(),
        createDirectory: vi.fn(),
        delete: vi.fn(),
        rename: vi.fn(),
        saveImage: vi.fn(),
        readImage: vi.fn()
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
        loadIndex: vi.fn(),
        getContent: vi.fn()
      },
      llm: {
        getInlineCompletion: vi.fn()
      }
    },
    writable: true
  });
};

const TestAutoSave = (): React.JSX.Element => {
  const { canSave, saveActiveFile } = useSaveActiveFile();
  useAutoSaveActiveFile({ canSave, saveActiveFile });
  return <div />;
};

describe('useAutoSaveActiveFile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    writeFile.mockResolvedValue(undefined);
    readFile.mockResolvedValue('Edited');
    installTnetApi();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('saves the modified active file after the configured debounce', async () => {
    const store = createAppStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(
      setSettings({
        ...defaultMarkdownProjectConfig(),
        markdown: {
          ...defaultMarkdownProjectConfig().markdown,
          autoSaveEnabled: true,
          autoSaveDebounceMs: 1000
        }
      })
    );
    store.dispatch(openFile({ path: '/workspace/note.md', content: 'Initial' }));
    store.dispatch(updateActiveContent('Edited'));

    render(
      <Provider store={store}>
        <TestAutoSave />
      </Provider>
    );

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(writeFile).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeFile).toHaveBeenCalledWith({
      rootDir: '/workspace',
      path: 'note.md',
      content: 'Edited'
    });
    expect(store.getState().editor.openedFiles[0].isModified).toBe(false);
  });

  it('does not schedule auto save when disabled', () => {
    const store = createAppStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(
      setSettings({
        ...defaultMarkdownProjectConfig(),
        markdown: {
          ...defaultMarkdownProjectConfig().markdown,
          autoSaveEnabled: false,
          autoSaveDebounceMs: 1000
        }
      })
    );
    store.dispatch(openFile({ path: '/workspace/note.md', content: 'Initial' }));
    store.dispatch(updateActiveContent('Edited'));

    render(
      <Provider store={store}>
        <TestAutoSave />
      </Provider>
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(writeFile).not.toHaveBeenCalled();
  });
});
