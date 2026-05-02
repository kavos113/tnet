import { describe, expect, it } from 'vitest';
import { toRssItemMarkdownLink } from './markdownLink';

describe('toRssItemMarkdownLink', () => {
  it('creates a stable rss item markdown link', () => {
    expect(toRssItemMarkdownLink({ id: 'item 1', title: 'A [post]' })).toBe(
      '[A \\[post\\]](rss:item/item%201)'
    );
  });
});
