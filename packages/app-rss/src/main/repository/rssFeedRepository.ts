import { randomUUID } from 'node:crypto';
import { normalizeRssUrl } from '@tnet/app-rss/shared/rssUrl';
import type {
  CreateRssFeedInput,
  ImportLocalRssFeedInput,
  MoveRssFeedInput,
  RssFeed,
  UpdateRssFeedInput
} from '@tnet/app-rss/shared/rssTypes';
import type { RssDatabase } from './rssDb';

interface FeedRow {
  id: string;
  folder_id: string | null;
  title: string;
  url: string;
  site_url: string | null;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  enabled: number;
  last_synced_at: string | null;
  last_sync_error: string | null;
  etag: string | null;
  last_modified: string | null;
  created_at: string;
  updated_at: string;
  unread_count: number;
}

const toFeed = (row: FeedRow): RssFeed => ({
  id: row.id,
  folderId: row.folder_id ?? undefined,
  title: row.title,
  url: row.url,
  siteUrl: row.site_url ?? undefined,
  description: row.description ?? undefined,
  iconUrl: row.icon_url ?? undefined,
  sortOrder: row.sort_order,
  enabled: row.enabled === 1,
  lastSyncedAt: row.last_synced_at ?? undefined,
  lastSyncError: row.last_sync_error ?? undefined,
  etag: row.etag ?? undefined,
  lastModified: row.last_modified ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  unreadCount: row.unread_count ?? 0
});

const selectFeedsSql = `
  SELECT f.id, f.folder_id, f.title, f.url, f.site_url, f.description, f.icon_url,
         f.sort_order, f.enabled, f.last_synced_at, f.last_sync_error, f.etag,
         f.last_modified, f.created_at, f.updated_at,
         COUNT(i.id) FILTER (WHERE i.read_at IS NULL AND i.archived_at IS NULL) AS unread_count
  FROM rss_feeds f
  LEFT JOIN rss_items i ON i.feed_id = f.id
`;

const selectBasicFeedsSql = `
  SELECT f.id, f.folder_id, f.title, f.url, f.site_url, f.description, f.icon_url,
         f.sort_order, f.enabled, f.last_synced_at, f.last_sync_error, f.etag,
         f.last_modified, f.created_at, f.updated_at, 0 AS unread_count
  FROM rss_feeds f
`;

export class RssFeedRepository {
  constructor(private readonly database: RssDatabase) {}

  list(): RssFeed[] {
    const rows = this.database
      .prepare(
        `${selectFeedsSql}
         GROUP BY f.id
         ORDER BY f.folder_id IS NOT NULL, f.sort_order ASC, lower(f.title) ASC`
      )
      .all() as FeedRow[];
    return rows.map(toFeed);
  }

  listBasic(): RssFeed[] {
    const rows = this.database
      .prepare(
        `${selectBasicFeedsSql}
         ORDER BY f.folder_id IS NOT NULL, f.sort_order ASC, lower(f.title) ASC`
      )
      .all() as FeedRow[];
    return rows.map(toFeed);
  }

  get(feedId: string): RssFeed | null {
    const row = this.database
      .prepare(
        `${selectFeedsSql}
         WHERE f.id = ?
         GROUP BY f.id`
      )
      .get(feedId) as FeedRow | undefined;
    return row ? toFeed(row) : null;
  }

  create(input: CreateRssFeedInput): RssFeed {
    const now = new Date().toISOString();
    const feedId = randomUUID();
    const url = normalizeRssUrl(input.url);
    this.database
      .prepare(
        `INSERT INTO rss_feeds (
           id, folder_id, title, url, sort_order, enabled, created_at, updated_at
         )
         VALUES (@id, @folderId, @title, @url, @sortOrder, 1, @createdAt, @updatedAt)`
      )
      .run({
        id: feedId,
        folderId: input.folderId ?? null,
        title: normalizeTitle(input.title) ?? url,
        url,
        sortOrder: this.nextSortOrder(input.folderId),
        createdAt: now,
        updatedAt: now
      });
    return this.require(feedId);
  }

  importLocalXml(input: ImportLocalRssFeedInput): RssFeed {
    const now = new Date().toISOString();
    const feedId = randomUUID();
    const url = `file://${input.filePath.replaceAll('\\', '/')}`;
    this.database
      .prepare(
        `INSERT INTO rss_feeds (
           id, folder_id, title, url, sort_order, enabled, created_at, updated_at
         )
         VALUES (@id, @folderId, @title, @url, @sortOrder, 1, @createdAt, @updatedAt)`
      )
      .run({
        id: feedId,
        folderId: input.folderId ?? null,
        title: normalizeTitle(input.title) ?? input.filePath,
        url,
        sortOrder: this.nextSortOrder(input.folderId),
        createdAt: now,
        updatedAt: now
      });
    return this.require(feedId);
  }

  update(input: UpdateRssFeedInput): RssFeed {
    const existing = this.require(input.feedId);
    const title = normalizeTitle(input.title) ?? existing.title;
    const url = input.url ? normalizeRssUrl(input.url) : existing.url;
    this.database
      .prepare(
        `UPDATE rss_feeds
         SET title = @title, url = @url, enabled = @enabled, updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id: existing.id,
        title,
        url,
        enabled: (input.enabled ?? existing.enabled) ? 1 : 0,
        updatedAt: new Date().toISOString()
      });
    return this.require(existing.id);
  }

  move(input: MoveRssFeedInput): RssFeed {
    const existing = this.require(input.feedId);
    this.database
      .prepare('UPDATE rss_feeds SET folder_id = ?, sort_order = ?, updated_at = ? WHERE id = ?')
      .run(
        input.folderId ?? null,
        this.nextSortOrder(input.folderId),
        new Date().toISOString(),
        existing.id
      );
    return this.require(existing.id);
  }

  remove(feedId: string): void {
    this.database.prepare('DELETE FROM rss_feeds WHERE id = ?').run(feedId);
  }

  updateSyncMetadata(
    feedId: string,
    metadata: {
      title?: string;
      siteUrl?: string;
      description?: string;
      etag?: string;
      lastModified?: string;
      lastSyncedAt: string;
      lastSyncError?: string;
    }
  ): RssFeed {
    const existing = this.require(feedId);
    this.database
      .prepare(
        `UPDATE rss_feeds
         SET title = @title,
             site_url = @siteUrl,
             description = @description,
             etag = @etag,
             last_modified = @lastModified,
             last_synced_at = @lastSyncedAt,
             last_sync_error = @lastSyncError,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id: existing.id,
        title: existing.title.trim() ? existing.title : (metadata.title ?? existing.title),
        siteUrl: metadata.siteUrl ?? existing.siteUrl ?? null,
        description: metadata.description ?? existing.description ?? null,
        etag: metadata.etag ?? existing.etag ?? null,
        lastModified: metadata.lastModified ?? existing.lastModified ?? null,
        lastSyncedAt: metadata.lastSyncedAt,
        lastSyncError: metadata.lastSyncError ?? null,
        updatedAt: new Date().toISOString()
      });
    return this.require(existing.id);
  }

  updateSyncError(feedId: string, error: string): RssFeed {
    this.database
      .prepare(
        'UPDATE rss_feeds SET last_synced_at = ?, last_sync_error = ?, updated_at = ? WHERE id = ?'
      )
      .run(new Date().toISOString(), error, new Date().toISOString(), feedId);
    return this.require(feedId);
  }

  private require(feedId: string): RssFeed {
    const feed = this.get(feedId);
    if (!feed) throw new Error(`RSS feed not found: ${feedId}`);
    return feed;
  }

  private nextSortOrder(folderId: string | undefined): number {
    const row = this.database
      .prepare(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM rss_feeds WHERE folder_id IS ?'
      )
      .get(folderId ?? null) as { next_order: number };
    return row.next_order;
  }
}

const normalizeTitle = (title: string | undefined): string | undefined => {
  const normalized = title?.trim();
  return normalized || undefined;
};
