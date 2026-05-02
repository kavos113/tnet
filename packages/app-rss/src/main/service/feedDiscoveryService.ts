import { discoverFeedLinks } from '@tnet/app-rss/shared/feedDiscovery';
import { normalizeRssUrl } from '@tnet/app-rss/shared/rssUrl';

export class FeedDiscoveryService {
  constructor(
    private readonly options: {
      timeoutSeconds: number;
      userAgent?: string;
    }
  ) {}

  async discover(url: string): Promise<Array<{ title?: string; url: string }>> {
    const pageUrl = normalizeRssUrl(url);
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.options.timeoutSeconds * 1000);
    try {
      const response = await fetch(pageUrl, {
        signal: abortController.signal,
        headers: {
          'user-agent': this.options.userAgent ?? 'tnet-rss/1.0',
          accept: 'text/html, application/xhtml+xml;q=0.9, */*;q=0.8'
        }
      });
      if (!response.ok) throw new Error(`Feed discovery failed with HTTP ${response.status}.`);
      return discoverFeedLinks(await response.text(), pageUrl);
    } finally {
      clearTimeout(timeout);
    }
  }
}
