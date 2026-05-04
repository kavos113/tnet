import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RssFeed } from '@tnet/app-rss/shared/rssTypes';
import { FeedSyncService } from './feedSyncService';

describe('FeedSyncService', () => {
  const feeds: RssFeed[] = [
    feed({ id: 'ok', url: 'https://example.com/ok.xml' }),
    feed({ id: 'bad', url: 'https://example.com/bad.xml' })
  ];
  const feedRepository = {
    list: vi.fn(),
    updateSyncMetadata: vi.fn(),
    updateSyncError: vi.fn()
  };
  const itemRepository = {
    saveMany: vi.fn()
  };
  const fetchService = {
    fetch: vi.fn()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    feedRepository.list.mockReturnValue(feeds);
    feedRepository.updateSyncMetadata.mockImplementation((feedId: string) => feed({ id: feedId }));
    feedRepository.updateSyncError.mockImplementation((feedId: string) => feed({ id: feedId }));
    fetchService.fetch.mockImplementation((rssFeed: RssFeed) => {
      if (rssFeed.id === 'bad') throw new Error('network failed');
      return {
        status: 'ok',
        body: '<rss><channel><title>OK</title><item><guid>1</guid><title>One</title></item></channel></rss>'
      };
    });
  });

  it('isolates feed failures and saves successful items', async () => {
    const service = new FeedSyncService(
      feedRepository as never,
      itemRepository as never,
      fetchService as never
    );

    const result = await service.sync();

    expect(result.syncedFeedIds).toEqual(['ok']);
    expect(result.failedFeedIds).toEqual(['bad']);
    expect(itemRepository.saveMany).toHaveBeenCalledWith([
      expect.objectContaining({ feedId: 'ok', externalId: '1' })
    ]);
    expect(feedRepository.updateSyncError).toHaveBeenCalledWith('bad', 'network failed');
  });

  it('fetches feeds concurrently and persists results after fetches complete', async () => {
    const pendingFetches = new Map<string, () => void>();
    fetchService.fetch.mockImplementation(
      (rssFeed: RssFeed) =>
        new Promise((resolve) => {
          pendingFetches.set(rssFeed.id, () =>
            resolve({
              status: 'ok',
              body: `<rss><channel><title>${rssFeed.id}</title><item><guid>${rssFeed.id}</guid><title>${rssFeed.id}</title></item></channel></rss>`
            })
          );
        })
    );
    const service = new FeedSyncService(
      feedRepository as never,
      itemRepository as never,
      fetchService as never,
      { maxConcurrentFetches: 2 }
    );

    const syncPromise = service.sync();
    await vi.waitFor(() => expect(fetchService.fetch).toHaveBeenCalledTimes(2));

    expect(itemRepository.saveMany).not.toHaveBeenCalled();
    pendingFetches.get('ok')?.();
    pendingFetches.get('bad')?.();
    await syncPromise;

    expect(itemRepository.saveMany).toHaveBeenCalledTimes(2);
  });
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
