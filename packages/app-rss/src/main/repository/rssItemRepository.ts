import { randomUUID } from 'node:crypto';
import type {
  ListRssItemsRequest,
  ListRssItemsResult,
  RssItem
} from '@tnet/app-rss/shared/rssTypes';
import type { RssDatabase } from './rssDb';

export interface SaveParsedRssItemInput {
  feedId: string;
  externalId: string;
  title: string;
  link?: string;
  author?: string;
  summary?: string;
  contentHtml?: string;
  publishedAt?: string;
  updatedAt?: string;
}

interface ItemRow {
  id: string;
  feed_id: string;
  external_id: string;
  title: string;
  link: string | null;
  author: string | null;
  summary: string | null;
  content_html: string | null;
  published_at: string | null;
  updated_at: string | null;
  read_at: string | null;
  starred: number;
  archived_at: string | null;
  fetched_at: string;
}

const toItem = (row: ItemRow): RssItem => ({
  id: row.id,
  feedId: row.feed_id,
  externalId: row.external_id,
  title: row.title,
  link: row.link ?? undefined,
  author: row.author ?? undefined,
  summary: row.summary ?? undefined,
  contentHtml: row.content_html ?? undefined,
  publishedAt: row.published_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
  readAt: row.read_at ?? undefined,
  starred: row.starred === 1,
  archivedAt: row.archived_at ?? undefined,
  fetchedAt: row.fetched_at
});

export class RssItemRepository {
  constructor(private readonly database: RssDatabase) {}

  list(request: ListRssItemsRequest = {}): ListRssItemsResult {
    const limit = Math.min(100, Math.max(1, Math.floor(request.limit ?? 50)));
    const clauses: string[] = [];
    const params: Record<string, string | number> = { limit: limit + 1 };

    if (request.feedId) {
      clauses.push('feed_id = @feedId');
      params.feedId = request.feedId;
    }
    if (request.folderId) {
      clauses.push('feed_id IN (SELECT id FROM rss_feeds WHERE folder_id = @folderId)');
      params.folderId = request.folderId;
    }
    if (request.view === 'unread') clauses.push('read_at IS NULL AND archived_at IS NULL');
    else if (request.view === 'starred') clauses.push('starred = 1');
    else if (request.view === 'archived') clauses.push('archived_at IS NOT NULL');
    else clauses.push('archived_at IS NULL');

    const searchQuery = request.searchQuery?.trim();
    if (searchQuery) {
      clauses.push(
        '(title LIKE @searchQuery OR summary LIKE @searchQuery OR content_html LIKE @searchQuery)'
      );
      params.searchQuery = `%${searchQuery}%`;
    }

    if (request.cursor) {
      clauses.push('COALESCE(published_at, fetched_at) < @cursor');
      params.cursor = request.cursor;
    }

    const rows = this.database
      .prepare(
        `SELECT id, feed_id, external_id, title, link, author, summary, content_html,
                published_at, updated_at, read_at, starred, archived_at, fetched_at
         FROM rss_items
         WHERE ${clauses.join(' AND ')}
         ORDER BY COALESCE(published_at, fetched_at) DESC, id DESC
         LIMIT @limit`
      )
      .all(params) as ItemRow[];
    const mappedItems = rows.map(toItem);
    const dedupedItems = request.dedupe === false ? mappedItems : dedupeItems(mappedItems);
    const items = dedupedItems.slice(0, limit);
    return {
      items,
      nextCursor:
        dedupedItems.length > limit
          ? (items.at(-1)?.publishedAt ?? items.at(-1)?.fetchedAt)
          : undefined
    };
  }

  get(itemId: string): RssItem | null {
    const row = this.database
      .prepare(
        `SELECT id, feed_id, external_id, title, link, author, summary, content_html,
                published_at, updated_at, read_at, starred, archived_at, fetched_at
         FROM rss_items
         WHERE id = ?`
      )
      .get(itemId) as ItemRow | undefined;
    return row ? toItem(row) : null;
  }

  saveMany(items: SaveParsedRssItemInput[]): void {
    const save = this.database.prepare(
      `INSERT INTO rss_items (
         id, feed_id, external_id, title, link, author, summary, content_html,
         published_at, updated_at, read_at, starred, archived_at, fetched_at
       )
       VALUES (
         @id, @feedId, @externalId, @title, @link, @author, @summary, @contentHtml,
         @publishedAt, @updatedAt, NULL, 0, NULL, @fetchedAt
       )
       ON CONFLICT(feed_id, external_id) DO UPDATE SET
         title = excluded.title,
         link = COALESCE(excluded.link, rss_items.link),
         author = COALESCE(excluded.author, rss_items.author),
         summary = COALESCE(excluded.summary, rss_items.summary),
         content_html = COALESCE(excluded.content_html, rss_items.content_html),
         published_at = COALESCE(excluded.published_at, rss_items.published_at),
         updated_at = COALESCE(excluded.updated_at, rss_items.updated_at),
         fetched_at = excluded.fetched_at`
    );
    const transaction = this.database.transaction((inputs: SaveParsedRssItemInput[]) => {
      const fetchedAt = new Date().toISOString();
      inputs.forEach((item) => {
        save.run({
          id: randomUUID(),
          feedId: item.feedId,
          externalId: item.externalId,
          title: item.title.trim() || 'Untitled',
          link: item.link ?? null,
          author: item.author ?? null,
          summary: item.summary ?? null,
          contentHtml: item.contentHtml ?? null,
          publishedAt: item.publishedAt ?? null,
          updatedAt: item.updatedAt ?? null,
          fetchedAt
        });
      });
    });
    transaction(items);
  }

  markRead(itemId: string, read: boolean): RssItem {
    this.database
      .prepare('UPDATE rss_items SET read_at = ? WHERE id = ?')
      .run(read ? new Date().toISOString() : null, itemId);
    return this.require(itemId);
  }

  markAllRead(feedId?: string): void {
    if (feedId) {
      this.database
        .prepare('UPDATE rss_items SET read_at = COALESCE(read_at, ?) WHERE feed_id = ?')
        .run(new Date().toISOString(), feedId);
      return;
    }
    this.database
      .prepare('UPDATE rss_items SET read_at = COALESCE(read_at, ?)')
      .run(new Date().toISOString());
  }

  setStarred(itemId: string, starred: boolean): RssItem {
    this.database
      .prepare('UPDATE rss_items SET starred = ? WHERE id = ?')
      .run(starred ? 1 : 0, itemId);
    return this.require(itemId);
  }

  archive(itemId: string, archived: boolean): RssItem {
    this.database
      .prepare('UPDATE rss_items SET archived_at = ? WHERE id = ?')
      .run(archived ? new Date().toISOString() : null, itemId);
    return this.require(itemId);
  }

  private require(itemId: string): RssItem {
    const item = this.get(itemId);
    if (!item) throw new Error(`RSS item not found: ${itemId}`);
    return item;
  }
}

const dedupeItems = (items: RssItem[]): RssItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.link ?? item.externalId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
