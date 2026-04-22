import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@renderer/app/store';
import { setWorkspace } from '@renderer/features/workspace/workspaceSlice';
import { SettingsDialog } from './SettingsDialog';

const loadProject = vi.fn();
const saveProject = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: vi.fn(),
        write: vi.fn(),
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
        loadProject,
        saveProject
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

describe('SettingsDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadProject.mockResolvedValue({
      editorFontFamily: 'Editor Font',
      editorFontSize: 18,
      previewFontFamily: 'Preview Font',
      previewFontSize: 19,
      llmInlineCompletionEnabled: true,
      llmProvider: 'mock',
      llmModel: 'mock-inline-completion',
      llmEndpoint: '',
      llmApiKey: '',
      llmAutomaticTrigger: false,
      llmDebounceMs: 600,
      llmMaxPrefixChars: 6000,
      llmMaxSuffixChars: 1500
    });
    saveProject.mockResolvedValue(undefined);
    installTnetApi();
  });

  it('loads project settings into a draft and saves the edited draft', async () => {
    const store = createAppStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <SettingsDialog isOpen={true} onClose={onClose} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByLabelText('Font family')[0]).toHaveValue('Editor Font');
    });

    fireEvent.change(screen.getAllByLabelText('Font size (px)')[0], { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'local-http' } });
    fireEvent.change(screen.getByLabelText('Endpoint'), {
      target: { value: 'http://localhost:11434/inline' }
    });
    fireEvent.click(screen.getByLabelText('Automatic trigger'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(saveProject).toHaveBeenCalledWith(
        '/workspace',
        expect.objectContaining({
          editorFontSize: 20,
          llmProvider: 'local-http',
          llmEndpoint: 'http://localhost:11434/inline',
          llmAutomaticTrigger: true
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});
