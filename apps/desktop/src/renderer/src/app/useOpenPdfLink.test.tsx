import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from './store';
import { useOpenPdfLink } from './useOpenPdfLink';

const loadGlobal = vi.fn();
const saveGlobal = vi.fn();
const getFileTree = vi.fn();

const OpenPdfLinkButton = ({ href }: { href: string }): React.JSX.Element => {
  const openPdfLink = useOpenPdfLink();
  return (
    <button type="button" onClick={() => openPdfLink(href)}>
      Open PDF link
    </button>
  );
};

describe('useOpenPdfLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'tnet', {
      value: {
        config: {
          loadGlobal,
          saveGlobal
        },
        workspace: {
          getFileTree
        }
      },
      writable: true
    });
    saveGlobal.mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  it('opens a PDF link by workspace name and switches to the PDF Viewer app', async () => {
    loadGlobal.mockResolvedValue({
      apps: {
        'pdf-viewer': {
          workspaceRoots: ['C:/workspace/slides']
        }
      }
    });
    getFileTree.mockResolvedValue([
      {
        name: '0407.pdf',
        path: 'C:/workspace/slides/0407.pdf',
        isDirectory: false
      }
    ]);
    const store = createAppStore();

    render(
      <Provider store={store}>
        <OpenPdfLinkButton href="pdf:slides/0407.pdf" />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open PDF link' }));

    await waitFor(() => {
      expect(store.getState().app.activeAppId).toBe('pdf-viewer');
    });

    expect(store.getState().pdfViewer.rootPath).toBe('C:/workspace/slides');
    expect(store.getState().pdfViewer.tabs).toEqual(['0407.pdf']);
    expect(saveGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        activeAppId: 'pdf-viewer',
        apps: expect.objectContaining({
          'pdf-viewer': expect.objectContaining({
            activeWorkspaceRoot: 'C:/workspace/slides',
            workspaceRoots: ['C:/workspace/slides']
          })
        })
      })
    );
  });

  it('shows an error when a workspace name is ambiguous', async () => {
    loadGlobal.mockResolvedValue({
      apps: {
        'pdf-viewer': {
          workspaceRoots: ['C:/workspace/slides', 'D:/backup/slides']
        }
      }
    });
    const store = createAppStore();

    render(
      <Provider store={store}>
        <OpenPdfLinkButton href="pdf:slides/0407.pdf" />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open PDF link' }));

    await waitFor(() => {
      expect(store.getState().app.activeAppId).toBe('pdf-viewer');
    });

    expect(store.getState().pdfViewer.error).toBe('PDF workspace name is ambiguous: slides');
    expect(getFileTree).not.toHaveBeenCalled();
  });
});
