import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { RssRuntime } from './RssRuntime';
import rssReducer from './rssSlice';
import { rssTnetApi } from './rssTnetApi';

vi.mock('./rssTnetApi', () => ({
  rssTnetApi: {
    rss: {
      config: {
        loadGlobal: vi.fn()
      },
      feeds: {
        sync: vi.fn(),
        listBasic: vi.fn(),
        list: vi.fn()
      },
      folders: {
        list: vi.fn(),
        listTree: vi.fn()
      },
      items: {
        list: vi.fn()
      }
    }
  }
}));

describe('RssRuntime', () => {
  let store: EnhancedStore<{ rss: ReturnType<typeof rssReducer> }>;

  beforeEach(() => {
    vi.resetAllMocks();
    store = configureStore({ reducer: { rss: rssReducer } });
    vi.mocked(rssTnetApi.rss.config.loadGlobal).mockResolvedValue({
      settings: {
        ...defaultRssGlobalSettings(),
        syncIntervalMinutes: 0.001,
        syncOnStartup: true
      }
    });
    vi.mocked(rssTnetApi.rss.feeds.sync).mockResolvedValue({
      feeds: [],
      syncedFeedIds: [],
      failedFeedIds: []
    });
    vi.mocked(rssTnetApi.rss.feeds.listBasic).mockResolvedValue([
      {
        id: 'feed-1',
        title: 'Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      }
    ]);
    vi.mocked(rssTnetApi.rss.folders.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.feeds.list).mockResolvedValue([
      {
        id: 'feed-1',
        title: 'Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 1
      }
    ]);
    vi.mocked(rssTnetApi.rss.folders.listTree).mockResolvedValue({ folders: [], feeds: [] });
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValue({ items: [] });
  });

  it('restores data and starts periodic sync', async () => {
    const rendered = render(
      <Provider store={store}>
        <RssRuntime />
      </Provider>
    );

    await waitFor(() => expect(store.getState().rss.isRestored).toBe(true));
    await waitFor(() => expect(rssTnetApi.rss.feeds.sync).toHaveBeenCalled());

    await waitFor(
      () => expect(vi.mocked(rssTnetApi.rss.feeds.sync).mock.calls.length).toBeGreaterThan(1),
      {
        timeout: 1000
      }
    );
    rendered.unmount();
  });

  it('restores unread counts before startup sync finishes', async () => {
    vi.mocked(rssTnetApi.rss.config.loadGlobal).mockResolvedValue({
      settings: {
        ...defaultRssGlobalSettings(),
        syncIntervalMinutes: 60,
        syncOnStartup: true
      }
    });
    let resolveSync: () => void = () => {};
    vi.mocked(rssTnetApi.rss.feeds.sync).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSync = () =>
          resolve({
            feeds: [],
            syncedFeedIds: ['feed-1'],
            failedFeedIds: []
          });
      })
    );

    const rendered = render(
      <Provider store={store}>
        <RssRuntime />
      </Provider>
    );

    await waitFor(() => expect(store.getState().rss.feeds[0]?.unreadCount).toBe(1));
    expect(store.getState().rss.syncingFeedIds).toEqual(['feed-1']);
    resolveSync();
    rendered.unmount();
  });

  it('restores a basic feed list before detailed sidebar data finishes loading', async () => {
    vi.mocked(rssTnetApi.rss.config.loadGlobal).mockResolvedValue({
      settings: {
        ...defaultRssGlobalSettings(),
        syncIntervalMinutes: 60,
        syncOnStartup: false
      }
    });
    vi.mocked(rssTnetApi.rss.feeds.listBasic).mockResolvedValue([
      {
        id: 'feed-1',
        title: 'Fast Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      }
    ]);
    let resolveDetailedFeeds: (
      feeds: Awaited<ReturnType<typeof rssTnetApi.rss.feeds.list>>
    ) => void = () => {};
    vi.mocked(rssTnetApi.rss.feeds.list).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDetailedFeeds = resolve;
      })
    );

    const rendered = render(
      <Provider store={store}>
        <RssRuntime />
      </Provider>
    );

    await waitFor(() => expect(store.getState().rss.feeds[0]?.title).toBe('Fast Feed'));
    expect(store.getState().rss.isSidebarDetailsLoading).toBe(true);

    resolveDetailedFeeds([
      {
        id: 'feed-1',
        title: 'Fast Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 5
      }
    ]);

    await waitFor(() => expect(store.getState().rss.feeds[0]?.unreadCount).toBe(5));
    expect(store.getState().rss.isSidebarDetailsLoading).toBe(false);
    rendered.unmount();
  });
});
