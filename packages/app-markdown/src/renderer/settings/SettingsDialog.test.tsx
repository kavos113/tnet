import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultMarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { setWorkspace } from '../workspace/workspaceSlice';
import { createAppStore } from '../test/createMarkdownTestStore';
import { MarkdownGlobalSettingsPage, SettingsDialog } from './SettingsDialog';

const loadProject = vi.fn();
const saveProject = vi.fn();
const loadGlobal = vi.fn();
const saveGlobal = vi.fn();

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
        loadGlobal,
        saveGlobal
      },
      markdown: {
        config: {
          loadProject,
          saveProject
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
      }
    },
    writable: true
  });
};

describe('SettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadProject.mockResolvedValue({
      markdown: {
        ...defaultMarkdownProjectConfig().markdown,
        editorFontFamily: 'Editor Font',
        editorFontSize: 18,
        previewFontFamily: 'Preview Font',
        previewFontSize: 19
      },
      llm: defaultMarkdownProjectConfig().llm
    });
    loadGlobal.mockResolvedValue({});
    saveGlobal.mockResolvedValue(undefined);
    saveProject.mockResolvedValue(undefined);
    installTnetApi();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads markdown project settings into a draft and saves the edited draft', async () => {
    const store = createAppStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <SettingsDialog isOpen={true} onClose={onClose} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Enable auto save')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Enable auto save'));
    fireEvent.change(screen.getAllByLabelText('Debounce (ms)')[0], {
      target: { value: '1500' }
    });
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'local-http' } });
    fireEvent.change(screen.getByLabelText('Endpoint'), {
      target: { value: 'http://localhost:11434/inline' }
    });
    fireEvent.click(screen.getByLabelText('Automatic trigger'));
    fireEvent.change(screen.getByLabelText('Request timeout (ms)'), {
      target: { value: '45000' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveProject).toHaveBeenCalledWith(
        '/workspace',
        expect.objectContaining({
          markdown: expect.objectContaining({
            autoSaveEnabled: false,
            autoSaveDebounceMs: 1500
          }),
          llm: expect.objectContaining({
            llmProvider: 'local-http',
            llmEndpoint: 'http://localhost:11434/inline',
            llmAutomaticTrigger: true,
            llmRequestTimeoutMs: 45000
          })
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('saves markdown font settings to the app global settings slot', async () => {
    const store = createAppStore();
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <MarkdownGlobalSettingsPage onClose={onClose} />
      </Provider>
    );

    await waitFor(() => {
      expect(loadGlobal).toHaveBeenCalled();
    });

    fireEvent.change(screen.getAllByLabelText('Font family')[0], {
      target: { value: 'Code Font' }
    });
    fireEvent.change(screen.getAllByLabelText('Font size (px)')[0], {
      target: { value: '18' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveGlobal).toHaveBeenCalledWith(
        expect.objectContaining({
          apps: expect.objectContaining({
            markdown: expect.objectContaining({
              settings: expect.objectContaining({
                editorFontFamily: 'Code Font',
                editorFontSize: 18
              })
            })
          })
        })
      );
      expect(store.getState().workspace.globalSettings.editorFontFamily).toBe('Code Font');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
