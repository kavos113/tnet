import { describe, expect, it } from 'vitest';
import { exportFeedsToOpml, parseOpmlFeeds } from './opml';
import type { RssFeed } from './rssTypes';

describe('OPML helpers', () => {
  it('imports outline xmlUrl entries', () => {
    const feeds = parseOpmlFeeds(`
      <opml><body>
        <outline text="Example" xmlUrl="https://example.com/feed.xml" />
      </body></opml>
    `);

    expect(feeds).toEqual([{ title: 'Example', url: 'https://example.com/feed.xml' }]);
  });

  it('exports subscriptions as OPML', () => {
    const opml = exportFeedsToOpml([
      {
        id: 'feed-1',
        title: 'Example',
        url: 'https://example.com/feed.xml',
        sortOrder: 1,
        enabled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        unreadCount: 0
      } satisfies RssFeed
    ]);

    expect(opml).toContain('xmlUrl="https://example.com/feed.xml"');
  });
});
