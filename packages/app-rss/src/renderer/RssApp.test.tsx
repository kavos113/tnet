import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import type { RssSyncResult } from '@tnet/app-rss/shared/rssTypes';
import { RssApp } from './RssApp';
import rssReducer, {
  restoreRss,
  selectRssFeed,
  selectRssSystemView,
  setRssSettings
} from './rssSlice';
import { rssTnetApi } from './rssTnetApi';

vi.mock('./rssTnetApi', () => ({
  rssTnetApi: {
    rss: {
      items: {
        list: vi.fn(),
        markRead: vi.fn(),
        markUnread: vi.fn(),
        setStarred: vi.fn(),
        archive: vi.fn()
      },
      feeds: {
        listBasic: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        move: vi.fn(),
        remove: vi.fn(),
        discover: vi.fn(),
        list: vi.fn(),
        sync: vi.fn()
      },
      folders: {
        listTree: vi.fn()
      }
    }
  }
}));

describe('RssApp', () => {
  let store: EnhancedStore<{ rss: ReturnType<typeof rssReducer> }>;

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
        folders: [],
        feeds: [
          {
            id: 'feed-1',
            title: 'Example Feed',
            url: 'https://example.com/feed.xml',
            sortOrder: 1,
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            unreadCount: 1
          }
        ],
        tree: { folders: [], feeds: [] },
        items: {
          items: [
            {
              id: 'item-1',
              feedId: 'feed-1',
              externalId: 'external-1',
              title: 'First item',
              summary: 'Summary',
              contentHtml: '<p>Summary</p>',
              link: 'https://example.com/item',
              author: 'Author',
              starred: false,
              fetchedAt: '2026-05-01T00:00:00.000Z'
            }
          ],
          nextCursor: '2026-05-01T00:00:00.000Z'
        },
        settings: defaultRssGlobalSettings()
      })
    );
    store.dispatch(selectRssFeed('feed-1'));
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValue({
      items: [
        {
          id: 'item-1',
          feedId: 'feed-1',
          externalId: 'external-1',
          title: 'First item',
          summary: 'Summary',
          contentHtml: '<p>Summary</p>',
          link: 'https://example.com/item',
          author: 'Author',
          starred: false,
          fetchedAt: '2026-05-01T00:00:00.000Z'
        }
      ],
      nextCursor: '2026-05-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.items.markRead).mockResolvedValue({
      id: 'item-1',
      feedId: 'feed-1',
      externalId: 'external-1',
      title: 'First item',
      contentHtml: '<p>Summary</p>',
      link: 'https://example.com/item',
      readAt: '2026-05-01T01:00:00.000Z',
      starred: false,
      fetchedAt: '2026-05-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.items.setStarred).mockResolvedValue({
      id: 'item-1',
      feedId: 'feed-1',
      externalId: 'external-1',
      title: 'First item',
      contentHtml: '<p>Summary</p>',
      link: 'https://example.com/item',
      readAt: '2026-05-01T01:00:00.000Z',
      starred: true,
      fetchedAt: '2026-05-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.feeds.list).mockResolvedValue([
      {
        id: 'feed-1',
        title: 'Example Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 1
      }
    ]);
    vi.mocked(rssTnetApi.rss.feeds.sync).mockResolvedValue({
      feeds: [
        {
          id: 'feed-1',
          title: 'Example Feed',
          url: 'https://example.com/feed.xml',
          sortOrder: 1,
          enabled: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          unreadCount: 1
        }
      ],
      syncedFeedIds: ['feed-1'],
      failedFeedIds: []
    });
    vi.mocked(rssTnetApi.rss.feeds.discover).mockResolvedValue([
      { title: 'Discovered Feed', url: 'https://example.com/feed.xml' }
    ]);
    vi.mocked(rssTnetApi.rss.folders.listTree).mockResolvedValue({ folders: [], feeds: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it('marks an item read on open and shows detail metadata', async () => {
    renderApp();

    fireEvent.click(await screen.findByText('First item'));

    await waitFor(() =>
      expect(rssTnetApi.rss.items.markRead).toHaveBeenCalledWith({ itemId: 'item-1' })
    );
    expect(screen.getAllByText(/Example Feed/).length).toBeGreaterThan(0);
    expect(screen.getByText('Open Link')).toBeInTheDocument();
  });

  it('loads more items with the current cursor', async () => {
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValueOnce({
      items: [
        {
          id: 'item-1',
          feedId: 'feed-1',
          externalId: 'external-1',
          title: 'First item',
          starred: false,
          fetchedAt: '2026-05-01T00:00:00.000Z'
        }
      ],
      nextCursor: '2026-05-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValueOnce({
      items: [
        {
          id: 'item-2',
          feedId: 'feed-1',
          externalId: 'external-2',
          title: 'Second item',
          starred: false,
          fetchedAt: '2026-04-30T00:00:00.000Z'
        }
      ]
    });
    renderApp();

    fireEvent.click(await screen.findByText('Load More'));

    await waitFor(() =>
      expect(rssTnetApi.rss.items.list).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: '2026-05-01T00:00:00.000Z' })
      )
    );
    expect(await screen.findByText('Second item')).toBeInTheDocument();
  });

  it('loads more items when the list bottom intersects', async () => {
    const originalIntersectionObserver = globalThis.IntersectionObserver;
    let intersectionCallback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      value: vi.fn(function MockIntersectionObserver(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
        return {
          disconnect,
          observe,
          takeRecords: vi.fn(),
          unobserve: vi.fn()
        };
      })
    });
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValueOnce({
      items: [
        {
          id: 'item-1',
          feedId: 'feed-1',
          externalId: 'external-1',
          title: 'First item',
          starred: false,
          fetchedAt: '2026-05-01T00:00:00.000Z'
        }
      ],
      nextCursor: '2026-05-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValueOnce({
      items: [
        {
          id: 'item-2',
          feedId: 'feed-1',
          externalId: 'external-2',
          title: 'Second item',
          starred: false,
          fetchedAt: '2026-04-30T00:00:00.000Z'
        }
      ]
    });

    try {
      renderApp();

      expect(await screen.findByLabelText('Load more RSS items')).toBeInTheDocument();
      expect(observe).toHaveBeenCalled();
      act(() => {
        intersectionCallback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      await waitFor(() =>
        expect(rssTnetApi.rss.items.list).toHaveBeenCalledWith(
          expect.objectContaining({ cursor: '2026-05-01T00:00:00.000Z' })
        )
      );
      expect(await screen.findByText('Second item')).toBeInTheDocument();
    } finally {
      Object.defineProperty(globalThis, 'IntersectionObserver', {
        configurable: true,
        value: originalIntersectionObserver
      });
    }
  });

  it('hides item summaries when summary lines is zero', async () => {
    store.dispatch(
      setRssSettings({
        ...defaultRssGlobalSettings(),
        itemSummaryLineClamp: 0
      })
    );

    renderApp();

    expect(await screen.findByText('First item')).toBeInTheDocument();
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

  it('shows selected feed actions above the item list', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Renamed Feed');
    renderApp();

    fireEvent.click(await screen.findByTitle('Sync selected feed'));
    await waitFor(() =>
      expect(rssTnetApi.rss.feeds.sync).toHaveBeenCalledWith({ feedId: 'feed-1' })
    );

    fireEvent.click(screen.getByTitle('Rename selected feed'));
    await waitFor(() =>
      expect(rssTnetApi.rss.feeds.update).toHaveBeenCalledWith({
        feedId: 'feed-1',
        title: 'Renamed Feed'
      })
    );
  });

  it('shows sync-all progress while feeds are syncing', async () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [
          {
            id: 'feed-1',
            title: 'Example Feed',
            url: 'https://example.com/feed.xml',
            sortOrder: 1,
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            unreadCount: 1
          },
          {
            id: 'feed-2',
            title: 'Second Feed',
            url: 'https://example.org/rss',
            sortOrder: 2,
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            unreadCount: 0
          }
        ],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    store.dispatch(selectRssSystemView('all'));
    let resolveFirstSync: (result: RssSyncResult) => void = () => {};
    vi.mocked(rssTnetApi.rss.feeds.sync)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstSync = resolve;
        })
      )
      .mockResolvedValueOnce({
        feeds: [],
        syncedFeedIds: ['feed-2'],
        failedFeedIds: []
      });
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Sync All' }));

    expect(await screen.findByText('Syncing 1/2: Example Feed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Syncing' })).toBeDisabled();
    resolveFirstSync({
      feeds: [],
      syncedFeedIds: ['feed-1'],
      failedFeedIds: []
    });

    await waitFor(() =>
      expect(rssTnetApi.rss.feeds.sync).toHaveBeenNthCalledWith(2, { feedId: 'feed-2' })
    );
    await waitFor(() => expect(screen.queryByText(/Syncing 2\/2/)).not.toBeInTheDocument());
    expect(rssTnetApi.rss.feeds.sync).toHaveBeenNthCalledWith(1, { feedId: 'feed-1' });
  });

  it('shows the subscribe form when no feed is selected', () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );

    renderApp();

    expect(screen.getByRole('heading', { name: 'Subscribe Feed' })).toBeInTheDocument();
    expect(screen.getByLabelText('Feed URL')).toBeInTheDocument();
  });

  it('auto-fills the feed title from discovery when the URL field blurs', async () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    renderApp();

    const urlInput = screen.getByLabelText('Feed URL');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/feed.xml' } });
    fireEvent.blur(urlInput);

    expect(await screen.findByDisplayValue('Discovered Feed')).toBeInTheDocument();
    expect(rssTnetApi.rss.feeds.discover).toHaveBeenCalledWith({
      url: 'https://example.com/feed.xml'
    });
  });

  it('skips subscribing when the feed URL already exists', async () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [
          {
            id: 'feed-1',
            title: 'Existing Feed',
            url: 'https://example.com/feed.xml',
            sortOrder: 1,
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            unreadCount: 0
          }
        ],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    renderApp();

    fireEvent.change(screen.getByLabelText('Feed URL'), {
      target: { value: 'https://example.com/feed.xml#top' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Skipped existing feed.')).toBeInTheDocument();
    expect(rssTnetApi.rss.feeds.create).not.toHaveBeenCalled();
  });

  it('bulk imports newline-delimited feed URLs', async () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    vi.mocked(rssTnetApi.rss.feeds.create)
      .mockResolvedValueOnce({
        id: 'feed-2',
        title: 'First Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      })
      .mockResolvedValueOnce({
        id: 'feed-3',
        title: 'Second Feed',
        url: 'https://example.org/rss',
        sortOrder: 2,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      });
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Bulk Import URLs' }));
    fireEvent.change(screen.getByLabelText('Feed URLs'), {
      target: {
        value: 'https://example.com/feed.xml#top\n\nhttps://example.org/rss'
      }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import URLs' }));

    await waitFor(() => expect(rssTnetApi.rss.feeds.create).toHaveBeenCalledTimes(2));
    expect(rssTnetApi.rss.feeds.create).toHaveBeenNthCalledWith(1, {
      url: 'https://example.com/feed.xml',
      folderId: undefined
    });
    expect(rssTnetApi.rss.feeds.create).toHaveBeenNthCalledWith(2, {
      url: 'https://example.org/rss',
      folderId: undefined
    });
    expect(await screen.findByText('Imported 2 feeds.')).toBeInTheDocument();
    expect(screen.getByLabelText('Feed URLs')).toHaveValue('');
  });

  it('skips existing feed URLs during bulk import', async () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [
          {
            id: 'feed-1',
            title: 'Existing Feed',
            url: 'https://example.com/feed.xml',
            sortOrder: 1,
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            unreadCount: 0
          }
        ],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    vi.mocked(rssTnetApi.rss.feeds.create).mockResolvedValueOnce({
      id: 'feed-2',
      title: 'New Feed',
      url: 'https://example.org/rss',
      sortOrder: 2,
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      unreadCount: 0
    });
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Bulk Import URLs' }));
    fireEvent.change(screen.getByLabelText('Feed URLs'), {
      target: {
        value: 'https://example.com/feed.xml#top\nhttps://example.org/rss'
      }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import URLs' }));

    await waitFor(() => expect(rssTnetApi.rss.feeds.create).toHaveBeenCalledTimes(1));
    expect(rssTnetApi.rss.feeds.create).toHaveBeenCalledWith({
      url: 'https://example.org/rss',
      folderId: undefined
    });
    expect(
      await screen.findByText('Imported 1 feed. Skipped 1 existing feed.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Feed URLs')).toHaveValue('');
  });

  it('keeps failed URLs after a partial bulk import', async () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [],
        feeds: [],
        tree: { folders: [], feeds: [] },
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    vi.mocked(rssTnetApi.rss.feeds.create)
      .mockResolvedValueOnce({
        id: 'feed-2',
        title: 'First Feed',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      })
      .mockRejectedValueOnce(new Error('duplicate feed'))
      .mockResolvedValueOnce({
        id: 'feed-4',
        title: 'Third Feed',
        url: 'https://example.net/rss',
        sortOrder: 3,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      });
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Bulk Import URLs' }));
    fireEvent.change(screen.getByLabelText('Feed URLs'), {
      target: {
        value: 'https://example.com/feed.xml\nhttps://example.org/rss\nhttps://example.net/rss'
      }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import URLs' }));

    await waitFor(() => expect(rssTnetApi.rss.feeds.create).toHaveBeenCalledTimes(3));
    expect(await screen.findByText(/Imported 2 feeds\. Failed:/)).toBeInTheDocument();
    expect(screen.getByLabelText('Feed URLs')).toHaveValue('https://example.org/rss');
  });

  const renderApp = (): void => {
    render(
      <Provider store={store}>
        <RssApp />
      </Provider>
    );
  };
});
