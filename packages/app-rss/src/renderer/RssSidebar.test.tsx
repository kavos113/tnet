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
    vi.mocked(rssTnetApi.rss.feeds.sync).mockResolvedValue({
      feeds: [],
      syncedFeedIds: ['feed-1'],
      failedFeedIds: []
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renames and deletes folder nodes with confirmation', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Renamed');
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    renderSidebar();

    fireEvent.click(screen.getByTitle('Rename folder'));
    await waitFor(() =>
      expect(rssTnetApi.rss.folders.rename).toHaveBeenCalledWith({
        folderId: 'folder-1',
        name: 'Renamed'
      })
    );

    fireEvent.click(screen.getByTitle('Delete folder'));
    await waitFor(() =>
      expect(rssTnetApi.rss.folders.remove).toHaveBeenCalledWith({ folderId: 'folder-1' })
    );
  });

  it('syncs and renames feed nodes', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Renamed Feed');
    renderSidebar();

    fireEvent.click(screen.getByTitle('Sync feed'));
    await waitFor(() =>
      expect(rssTnetApi.rss.feeds.sync).toHaveBeenCalledWith({ feedId: 'feed-1' })
    );

    fireEvent.click(screen.getByTitle('Rename feed'));
    await waitFor(() =>
      expect(rssTnetApi.rss.feeds.update).toHaveBeenCalledWith({
        feedId: 'feed-1',
        title: 'Renamed Feed'
      })
    );
  });

  const renderSidebar = (): void => {
    render(
      <Provider store={store}>
        <RssSidebar />
      </Provider>
    );
  };
});
