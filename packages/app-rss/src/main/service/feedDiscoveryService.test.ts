import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedDiscoveryService } from './feedDiscoveryService';

describe('FeedDiscoveryService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the feed title when the URL points directly to RSS XML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          `<?xml version="1.0"?>
          <rss version="2.0">
            <channel>
              <title>Example RSS Title</title>
              <link>https://example.com</link>
            </channel>
          </rss>`,
          {
            status: 200,
            headers: { 'content-type': 'application/rss+xml' }
          }
        )
      )
    );

    const links = await new FeedDiscoveryService({ timeoutSeconds: 3 }).discover(
      'https://example.com/feed.xml'
    );

    expect(links).toEqual([{ title: 'Example RSS Title', url: 'https://example.com/feed.xml' }]);
  });
});
