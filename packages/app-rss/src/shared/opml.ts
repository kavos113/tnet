import type { RssFeed } from './rssTypes';

export interface OpmlFeedEntry {
  title: string;
  url: string;
}

export const parseOpmlFeeds = (opml: string): OpmlFeedEntry[] =>
  [...opml.matchAll(/<outline\b([^>]*)>/gi)]
    .map((match) => match[1])
    .map((attrs) => ({
      title:
        attr(attrs, 'title') ?? attr(attrs, 'text') ?? attr(attrs, 'xmlUrl') ?? 'Untitled Feed',
      url: attr(attrs, 'xmlUrl') ?? ''
    }))
    .filter((entry) => entry.url.trim().length > 0);

export const exportFeedsToOpml = (feeds: RssFeed[]): string => {
  const outlines = feeds
    .map(
      (feed) =>
        `    <outline text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" type="rss" xmlUrl="${escapeXml(feed.url)}"${feed.siteUrl ? ` htmlUrl="${escapeXml(feed.siteUrl)}"` : ''} />`
    )
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head><title>tnet RSS subscriptions</title></head>',
    '  <body>',
    outlines,
    '  </body>',
    '</opml>'
  ].join('\n');
};

const attr = (attrs: string, name: string): string | undefined => {
  const value = attrs.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
  return value ? unescapeXml(value) : undefined;
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const unescapeXml = (value: string): string =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
