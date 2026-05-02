import type { RssFeed, RssSyncResult } from '@tnet/app-rss/shared/rssTypes';
import type { RssFeedRepository } from '../repository/rssFeedRepository';
import type { RssItemRepository } from '../repository/rssItemRepository';
import type { FeedFetchService } from './feedFetchService';
import { parseFeedXml } from './feedParser';

export class FeedSyncService {
  constructor(
    private readonly feedRepository: RssFeedRepository,
    private readonly itemRepository: RssItemRepository,
    private readonly fetchService: FeedFetchService
  ) {}

  async sync(feedId?: string): Promise<RssSyncResult> {
    const feeds = feedId
      ? this.feedRepository.list().filter((feed) => feed.id === feedId)
      : this.feedRepository.list().filter((feed) => feed.enabled);
    const syncedFeedIds: string[] = [];
    const failedFeedIds: string[] = [];

    for (const feed of feeds) {
      try {
        await this.syncOne(feed);
        syncedFeedIds.push(feed.id);
      } catch (error) {
        failedFeedIds.push(feed.id);
        this.feedRepository.updateSyncError(
          feed.id,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return {
      feeds: this.feedRepository.list(),
      syncedFeedIds,
      failedFeedIds
    };
  }

  private async syncOne(feed: RssFeed): Promise<void> {
    const fetched = await this.fetchService.fetch(feed);
    const syncedAt = new Date().toISOString();
    if (fetched.status === 'not-modified') {
      this.feedRepository.updateSyncMetadata(feed.id, {
        etag: fetched.etag,
        lastModified: fetched.lastModified,
        lastSyncedAt: syncedAt
      });
      return;
    }
    if (!fetched.body) throw new Error('Feed response body is empty.');
    const parsed = parseFeedXml(fetched.body);
    this.itemRepository.saveMany(
      parsed.items.map((item) => ({
        feedId: feed.id,
        ...item
      }))
    );
    this.feedRepository.updateSyncMetadata(feed.id, {
      title: parsed.title,
      siteUrl: parsed.siteUrl,
      description: parsed.description,
      etag: fetched.etag,
      lastModified: fetched.lastModified,
      lastSyncedAt: syncedAt
    });
  }
}
