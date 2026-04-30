import { describe, expect, it } from 'vitest';
import { getTooltipPosition } from '@tnet/markdown-editor/renderer';
import { closestInternalLink, isInsideSameLink } from './internalLinkTarget';
import { KeywordTooltipCache } from './keywordTooltipCache';

describe('tooltip helpers', () => {
  it('finds internal links from element and text targets', () => {
    const link = document.createElement('a');
    link.dataset.internalLink = 'true';
    link.textContent = 'Keyword';
    const wrapper = document.createElement('span');
    link.append(wrapper);

    expect(closestInternalLink(wrapper)).toBe(link);
    expect(closestInternalLink(link.firstChild)).toBe(link);
  });

  it('detects movement inside the same link', () => {
    const link = document.createElement('a');
    const child = document.createElement('span');
    link.append(child);

    expect(isInsideSameLink(link, child)).toBe(true);
    expect(isInsideSameLink(link, document.createElement('span'))).toBe(false);
  });

  it('stores keyword tooltip content by stable key', () => {
    const cache = new KeywordTooltipCache();
    const key = KeywordTooltipCache.key('/a.md', 'A');

    expect(cache.get(key)).toBeUndefined();
    cache.set(key, 'content');
    expect(cache.get(key)).toBe('content');
    cache.set(key, null);
    expect(cache.get(key)).toBeNull();
  });

  it('positions tooltips without going below the minimum offset', () => {
    const event = new MouseEvent('mouseover', { clientX: 5, clientY: 30 });
    const rect = {
      left: 10,
      top: 20
    } as DOMRect;

    expect(getTooltipPosition(event, rect)).toEqual({ x: 8, y: 22 });
  });
});
