import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { RssApp } from './RssApp';
import rssReducer, { restoreRss, selectRssFeed } from './rssSlice';
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
        create: vi.fn(),
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
    expect(screen.getByText(/Example Feed/)).toBeInTheDocument();
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

  const renderApp = (): void => {
    render(
      <Provider store={store}>
        <RssApp />
      </Provider>
    );
  };
});
