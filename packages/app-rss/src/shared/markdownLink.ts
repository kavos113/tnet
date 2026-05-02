import type { RssItem } from './rssTypes';

export const toRssItemMarkdownLink = (item: Pick<RssItem, 'id' | 'title'>): string =>
  `[${escapeMarkdownLinkText(item.title)}](rss:item/${encodeURIComponent(item.id)})`;

const escapeMarkdownLinkText = (text: string): string =>
  text.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]');
