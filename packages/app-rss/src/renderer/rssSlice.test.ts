import { describe, expect, it } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import type { RssItem } from '@tnet/app-rss/shared/rssTypes';
import reducer, {
  appendRssItems,
  openRssSubscribe,
  restoreRss,
  restoreRssFeedList,
  selectRssFeed,
  selectRssFolder,
  selectRssItem,
  selectRssSystemView,
  setRssError,
  setRssFeeds,
  setRssFolders,
  setRssItems,
  setRssSettings,
  setRssSyncProgress,
  setRssSyncing,
  setRssTree,
  upsertRssItem
} from './rssSlice';

const item = (id: string): RssItem => ({
  id,
  feedId: 'feed-1',
  externalId: id,
  title: `Item ${id}`,
  link: `https://example.test/${id}`,
  contentHtml: '',
  author: '',
  publishedAt: '2026-05-03T00:00:00Z',
  starred: false,
  fetchedAt: '2026-05-03T00:00:00Z'
});

describe('rssSlice', () => {
  it('restores feeds, folders, tree, items, and settings', () => {
    const settings = { ...defaultRssGlobalSettings(), defaultFilter: 'all' as const };

    const state = reducer(
      undefined,
      restoreRss({
        folders: [
          {
            id: 'folder-1',
            name: 'Folder',
            parentId: undefined,
            sortOrder: 0,
            createdAt: '',
            updatedAt: ''
          }
        ],
        feeds: [
          {
            id: 'feed-1',
            title: 'Feed',
            url: 'https://example.test/feed.xml',
            siteUrl: 'https://example.test',
            folderId: 'folder-1',
            sortOrder: 0,
            enabled: true,
            createdAt: '',
            updatedAt: '',
            unreadCount: 1
          }
        ],
        tree: { folders: [], feeds: [] },
        items: { items: [item('item-1')], nextCursor: 'next' },
        settings
      })
    );

    expect(state.isRestored).toBe(true);
    expect(state.selectedView).toBe('all');
    expect(state.nextCursor).toBe('next');
    expect(state.isSidebarDetailsLoading).toBe(false);
  });

  it('restores a feed-only sidebar snapshot while details load', () => {
    const settings = { ...defaultRssGlobalSettings(), defaultFilter: 'unread' as const };

    const state = reducer(
      undefined,
      restoreRssFeedList({
        feeds: [
          {
            id: 'feed-1',
            title: 'Feed',
            url: 'https://example.test/feed.xml',
            sortOrder: 0,
            enabled: true,
            createdAt: '',
            updatedAt: '',
            unreadCount: 0
          }
        ],
        tree: { folders: [], feeds: [] },
        settings
      })
    );

    expect(state.isRestored).toBe(true);
    expect(state.selectedView).toBe('unread');
    expect(state.feeds).toHaveLength(1);
    expect(state.isSidebarDetailsLoading).toBe(true);
  });

  it('updates lists, selection, sync state, and errors', () => {
    let state = reducer(undefined, setRssFolders([]));
    state = reducer(state, setRssFeeds([]));
    state = reducer(state, setRssTree({ folders: [], feeds: [] }));
    state = reducer(state, setRssItems({ items: [item('item-1')], nextCursor: 'cursor-1' }));
    state = reducer(state, appendRssItems({ items: [item('item-2')], nextCursor: undefined }));
    state = reducer(state, selectRssFeed('feed-1'));
    state = reducer(state, selectRssItem('item-1'));
    state = reducer(state, selectRssFolder('folder-1'));
    state = reducer(state, selectRssSystemView('unread'));
    state = reducer(
      state,
      setRssSettings({ ...defaultRssGlobalSettings(), markReadOnOpen: false })
    );
    state = reducer(state, setRssSyncing(true));
    state = reducer(state, setRssSyncProgress({ current: 1, total: 2, currentFeedTitle: 'Feed' }));
    state = reducer(state, setRssError('failed'));
    state = reducer(state, openRssSubscribe());

    expect(state.items.map((rssItem) => rssItem.id)).toEqual(['item-1', 'item-2']);
    expect(state.selectedView).toBe('unread');
    expect(state.selectedFeedId).toBeUndefined();
    expect(state.selectedFolderId).toBeUndefined();
    expect(state.selectedItemId).toBeUndefined();
    expect(state.isSubscribeOpen).toBe(true);
    expect(state.isSyncing).toBe(true);
    expect(state.syncProgress).toEqual({ current: 1, total: 2, currentFeedTitle: 'Feed' });
    expect(state.error).toBe('failed');
    expect(state.settings.markReadOnOpen).toBe(false);
  });

  it('clears sync progress when syncing finishes', () => {
    let state = reducer(undefined, setRssSyncing(true));
    state = reducer(state, setRssSyncProgress({ current: 1, total: 1 }));
    state = reducer(state, setRssSyncing(false));

    expect(state.isSyncing).toBe(false);
    expect(state.syncProgress).toBeUndefined();
  });

  it('upserts only existing items', () => {
    let state = reducer(undefined, setRssItems({ items: [item('item-1')], nextCursor: undefined }));
    state = reducer(state, upsertRssItem({ ...item('missing'), title: 'Missing' }));
    state = reducer(state, upsertRssItem({ ...item('item-1'), title: 'Updated' }));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].title).toBe('Updated');
  });
});
