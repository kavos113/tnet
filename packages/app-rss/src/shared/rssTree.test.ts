import { describe, expect, it } from 'vitest';
import { buildRssTree } from './rssTree';
import type { RssFeed, RssFolder } from './rssTypes';

describe('buildRssTree', () => {
  it('groups feeds under virtual folders', () => {
    const folders: RssFolder[] = [
      folder({ id: 'root', name: 'Root' }),
      folder({ id: 'child', parentId: 'root', name: 'Child' })
    ];
    const feeds: RssFeed[] = [
      feed({ id: 'a', folderId: 'child', title: 'A', unreadCount: 2 }),
      feed({ id: 'b', title: 'B', unreadCount: 1 })
    ];

    const tree = buildRssTree(folders, feeds);

    expect(tree.folders[0].folders[0].feeds[0]).toMatchObject({
      id: 'a',
      unreadCount: 2
    });
    expect(tree.feeds[0]).toMatchObject({ id: 'b' });
  });
});

const folder = (overrides: Partial<RssFolder>): RssFolder => ({
  id: 'folder',
  name: 'Folder',
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides
});

const feed = (overrides: Partial<RssFeed>): RssFeed => ({
  id: 'feed',
  title: 'Feed',
  url: 'https://example.com/feed.xml',
  sortOrder: 1,
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  unreadCount: 0,
  ...overrides
});
