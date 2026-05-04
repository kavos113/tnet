import { describe, expect, it } from 'vitest';
import { isValidRssUrl, normalizeRssUrl, parseRssUrlList } from './rssUrl';

describe('rssUrl', () => {
  it('accepts http URLs and removes fragments', () => {
    expect(normalizeRssUrl(' https://example.com/feed.xml#top ')).toBe(
      'https://example.com/feed.xml'
    );
  });

  it('rejects non-http URLs', () => {
    expect(isValidRssUrl('file:///tmp/feed.xml')).toBe(false);
  });

  it('parses newline-delimited URL lists', () => {
    const result = parseRssUrlList(`
      https://example.com/feed.xml#top

      https://example.org/rss
      https://example.com/feed.xml
      file:///tmp/feed.xml
    `);

    expect(result).toEqual({
      urls: ['https://example.com/feed.xml', 'https://example.org/rss'],
      invalidLines: ['file:///tmp/feed.xml']
    });
  });
});
