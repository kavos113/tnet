import { describe, expect, it } from 'vitest';
import { isValidRssUrl, normalizeRssUrl } from './rssUrl';

describe('rssUrl', () => {
  it('accepts http URLs and removes fragments', () => {
    expect(normalizeRssUrl(' https://example.com/feed.xml#top ')).toBe(
      'https://example.com/feed.xml'
    );
  });

  it('rejects non-http URLs', () => {
    expect(isValidRssUrl('file:///tmp/feed.xml')).toBe(false);
  });
});
