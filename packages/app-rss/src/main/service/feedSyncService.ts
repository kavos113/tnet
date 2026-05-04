import type { RssFeed, RssSyncResult } from '@tnet/app-rss/shared/rssTypes';
import type { RssFeedRepository } from '../repository/rssFeedRepository';
import type { RssItemRepository } from '../repository/rssItemRepository';
import type { FeedFetchResult } from './feedFetchService';
import type { FeedFetchService } from './feedFetchService';
import type { ParsedFeed } from './feedParser';
import { parseFeedXml } from './feedParser';

const defaultMaxConcurrentFetches = 6;

type SyncFetchResult =
  | {
      status: 'synced';
      feed: RssFeed;
      fetched: FeedFetchResult;
      parsed?: ParsedFeed;
      syncedAt: string;
    }
  | {
      status: 'failed';
      feed: RssFeed;
      error: string;
    };

export class FeedSyncService {
  constructor(
    private readonly feedRepository: RssFeedRepository,
    private readonly itemRepository: RssItemRepository,
    private readonly fetchService: FeedFetchService,
    private readonly options: {
      maxConcurrentFetches?: number;
    } = {}
  ) {}

  async sync(feedId?: string): Promise<RssSyncResult> {
    const feeds = feedId
      ? this.feedRepository.list().filter((feed) => feed.id === feedId)
      : this.feedRepository.list().filter((feed) => feed.enabled);
    const syncedFeedIds: string[] = [];
    const failedFeedIds: string[] = [];
    const results = await mapConcurrent(
      feeds,
      this.options.maxConcurrentFetches ?? defaultMaxConcurrentFetches,
      (feed) => this.fetchAndParse(feed)
    );

    for (const result of results) {
      if (result.status === 'failed') {
        failedFeedIds.push(result.feed.id);
        this.feedRepository.updateSyncError(result.feed.id, result.error);
        continue;
      }
      this.persistSyncedFeed(result);
      syncedFeedIds.push(result.feed.id);
    }

    return {
      feeds: this.feedRepository.list(),
      syncedFeedIds,
      failedFeedIds
    };
  }

  private async fetchAndParse(feed: RssFeed): Promise<SyncFetchResult> {
    try {
      const fetched = await this.fetchService.fetch(feed);
      if (fetched.status === 'not-modified') {
        return {
          status: 'synced',
          feed,
          fetched,
          syncedAt: new Date().toISOString()
        };
      }
      if (!fetched.body) throw new Error('Feed response body is empty.');
      return {
        status: 'synced',
        feed,
        fetched,
        parsed: parseFeedXml(fetched.body),
        syncedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        feed,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private persistSyncedFeed(result: Extract<SyncFetchResult, { status: 'synced' }>): void {
    if (result.fetched.status === 'not-modified') {
      this.feedRepository.updateSyncMetadata(result.feed.id, {
        etag: result.fetched.etag,
        lastModified: result.fetched.lastModified,
        lastSyncedAt: result.syncedAt
      });
      return;
    }
    if (!result.parsed) throw new Error('Parsed feed is missing.');
    this.itemRepository.saveMany(
      result.parsed.items.map((item) => ({
        feedId: result.feed.id,
        ...item
      }))
    );
    this.feedRepository.updateSyncMetadata(result.feed.id, {
      title: result.parsed.title,
      siteUrl: result.parsed.siteUrl,
      description: result.parsed.description,
      etag: result.fetched.etag,
      lastModified: result.fetched.lastModified,
      lastSyncedAt: result.syncedAt
    });
  }
}

const mapConcurrent = async <Input, Output>(
  inputs: Input[],
  concurrency: number,
  mapper: (input: Input) => Promise<Output>
): Promise<Output[]> => {
  const results = Array.from<Output | undefined>({ length: inputs.length });
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, inputs.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < inputs.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await mapper(inputs[index]);
      }
    })
  );

  return results as Output[];
};
