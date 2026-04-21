import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@renderer/app/store';
import { PreviewPane } from './PreviewPane';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn().mockResolvedValue(undefined)
  }
}));

const keywordGetContent = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: vi.fn().mockResolvedValue('opened content'),
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
        loadProject: vi.fn(),
        saveProject: vi.fn()
      },
      keyword: {
        loadIndex: vi.fn(),
        getContent: keywordGetContent
      }
    },
    writable: true
  });
};

describe('PreviewPane', () => {
  beforeEach(() => {
    keywordGetContent.mockReset();
    installTnetApi();
  });

  it('shows rendered keyword content while hovering an internal link', async () => {
    let resolveKeyword: (content: string) => void = () => {};
    keywordGetContent.mockReturnValue(
      new Promise((resolve) => {
        resolveKeyword = resolve;
      })
    );

    render(
      <Provider store={createAppStore()}>
        <PreviewPane markdown="See [[/docs/keyword.md|Keyword]]." />
      </Provider>
    );

    const link = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.mouseOver(link, { clientX: 20, clientY: 30 });

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    await act(async () => resolveKeyword('**Tooltip** body'));

    expect(await screen.findByText('Tooltip')).toBeInTheDocument();
    expect(keywordGetContent).toHaveBeenCalledWith('/docs/keyword.md', 'Keyword');
  });

  it('uses a missing message when keyword content is not found', async () => {
    keywordGetContent.mockResolvedValue(null);

    render(
      <Provider store={createAppStore()}>
        <PreviewPane markdown="See [[/docs/keyword.md|Missing]]." />
      </Provider>
    );

    const link = await screen.findByRole('link', { name: 'Missing' });
    fireEvent.mouseOver(link);

    expect(await screen.findByText('Keyword not found.')).toBeInTheDocument();
  });
});
