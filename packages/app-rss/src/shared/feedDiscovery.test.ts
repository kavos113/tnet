import { describe, expect, it } from 'vitest';
import { discoverFeedLinks } from './feedDiscovery';

describe('discoverFeedLinks', () => {
  it('resolves alternate feed links against the page URL', () => {
    const links = discoverFeedLinks(
      '<link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml">',
      'https://example.com/posts/'
    );

    expect(links).toEqual([{ title: 'RSS', url: 'https://example.com/feed.xml' }]);
  });
});
