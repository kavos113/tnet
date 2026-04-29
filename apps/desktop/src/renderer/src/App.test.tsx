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
});
