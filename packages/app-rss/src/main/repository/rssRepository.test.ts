import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  RssFeedRepository,
  RssFolderRepository,
  RssItemRepository,
  openRssDatabase
} from './index';

describe('RSS repositories', () => {
  let tempDir: string;
  let database: ReturnType<typeof openRssDatabase> | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-rss-test-'));
  });

  afterEach(() => {
    database?.close();
    database = undefined;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates folder/feed and tracks unread item counts', () => {
    database = openRssDatabase(tempDir);
    const folders = new RssFolderRepository(database);
    const feeds = new RssFeedRepository(database);
    const items = new RssItemRepository(database);

    const folder = folders.create({ name: 'Tech' });
    const feed = feeds.create({
      folderId: folder.id,
      title: 'Example',
      url: 'https://example.com/feed.xml'
    });
    items.saveMany([
      {
        feedId: feed.id,
        externalId: 'item-1',
        title: 'Item 1',
        publishedAt: '2026-05-01T00:00:00.000Z'
      }
    ]);

    expect(feeds.get(feed.id)?.unreadCount).toBe(1);
    const listed = items.list({ feedId: feed.id });
    expect(listed.items).toHaveLength(1);
    items.markRead(listed.items[0].id, true);
    expect(feeds.get(feed.id)?.unreadCount).toBe(0);
  });
});
