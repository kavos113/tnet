import type { RssFeed } from '@tnet/app-rss/shared/rssTypes';

export interface FeedFetchResult {
  status: 'not-modified' | 'ok';
  body?: string;
  etag?: string;
  lastModified?: string;
}

export class FeedFetchService {
  constructor(
    private readonly options: {
      timeoutSeconds: number;
      userAgent?: string;
    }
  ) {}

  async fetch(feed: RssFeed): Promise<FeedFetchResult> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.options.timeoutSeconds * 1000);
    try {
      const headers = new Headers({
        'user-agent': this.options.userAgent ?? 'tnet-rss/1.0',
        accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
      });
      if (feed.etag) headers.set('if-none-match', feed.etag);
      if (feed.lastModified) headers.set('if-modified-since', feed.lastModified);
      const response = await fetch(feed.url, { headers, signal: abortController.signal });
      if (response.status === 304) {
        return {
          status: 'not-modified',
          etag: response.headers.get('etag') ?? feed.etag,
          lastModified: response.headers.get('last-modified') ?? feed.lastModified
        };
      }
      if (!response.ok) throw new Error(`Feed fetch failed with HTTP ${response.status}.`);
      return {
        status: 'ok',
        body: await response.text(),
        etag: response.headers.get('etag') ?? undefined,
        lastModified: response.headers.get('last-modified') ?? undefined
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
