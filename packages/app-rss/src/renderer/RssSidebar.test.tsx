import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { RssSidebar } from './RssSidebar';
import rssReducer, { restoreRss } from './rssSlice';
import { rssTnetApi } from './rssTnetApi';

vi.mock('./rssTnetApi', () => ({
  rssTnetApi: {
    rss: {
      folders: {
        create: vi.fn(),
        rename: vi.fn(),
        move: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        listTree: vi.fn()
      },
      feeds: {
        update: vi.fn(),
        move: vi.fn(),
        remove: vi.fn(),
        sync: vi.fn(),
        list: vi.fn()
      }
    }
  }
}));

describe('RssSidebar', () => {
  let store: EnhancedStore<{ rss: ReturnType<typeof rssReducer> }>;
  const tree = {
    folders: [
      {
        kind: 'folder' as const,
        id: 'folder-1',
        name: 'Folder',
        folders: [],
        feeds: [
          {
            kind: 'feed' as const,
            id: 'feed-1',
            title: 'Feed',
            unreadCount: 3
          }
        ]
      }
    ],
    feeds: []
  };

  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(window, 'prompt', {
      configurable: true,
      value: vi.fn()
    });
    Object.defineProperty(window, 'confirm', {
      configurable: true,
      value: vi.fn()
    });
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [
          {
            id: 'folder-1',
            name: 'Folder',
            sortOrder: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ],
        feeds: [],
        tree,
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    vi.mocked(rssTnetApi.rss.folders.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.feeds.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.folders.listTree).mockResolvedValue(tree);
    vi.mocked(rssTnetApi.rss.folders.create).mockResolvedValue({
      id: 'folder-2',
      name: 'Created Folder',
      sortOrder: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.feeds.sync).mockResolvedValue({
      feeds: [],
      syncedFeedIds: ['feed-1'],
      failedFeedIds: []
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('creates folders with the shared directory tree entry', async () => {
    renderSidebar();

    fireEvent.click(screen.getByText('New Folder'));
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'Created Folder' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(rssTnetApi.rss.folders.create).toHaveBeenCalledWith({
        name: 'Created Folder',
        parentId: undefined
      })
    );
    expect(store.getState().rss.selectedFolderId).toBe('folder-2');
  });

  it('selects feed nodes without inline feed action buttons', () => {
    renderSidebar();

    fireEvent.click(screen.getByText('Folder'));
    fireEvent.click(screen.getByText('Feed (3)'));

    expect(store.getState().rss.selectedFeedId).toBe('feed-1');
    expect(screen.queryByTitle('Sync feed')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Rename feed')).not.toBeInTheDocument();
  });

  it('opens the subscribe screen from the new feed button', () => {
    renderSidebar();

    fireEvent.click(screen.getByText('New Feed'));

    expect(store.getState().rss.isSubscribeOpen).toBe(true);
    expect(store.getState().rss.selectedFeedId).toBeUndefined();
  });

  const renderSidebar = (): void => {
    render(
      <Provider store={store}>
        <RssSidebar />
      </Provider>
    );
  };
});
