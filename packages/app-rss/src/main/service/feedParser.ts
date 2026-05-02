import { normalizeFeedDate } from '@tnet/app-rss/shared/rssDate';
import { normalizeItemExternalId, normalizeLink } from '@tnet/app-rss/shared/rssIdentity';

export interface ParsedFeedItem {
  externalId: string;
  title: string;
  link?: string;
  author?: string;
  summary?: string;
  contentHtml?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface ParsedFeed {
  title?: string;
  siteUrl?: string;
  description?: string;
  items: ParsedFeedItem[];
}

export const parseFeedXml = (xml: string): ParsedFeed => {
  if (xml.trim().startsWith('{')) return parseJsonFeed(xml);
  if (/<feed[\s>]/i.test(xml)) return parseAtom(xml);
  if (/<rss[\s>]/i.test(xml) || /<rdf:RDF[\s>]/i.test(xml)) return parseRss(xml);
  throw new Error('Unsupported feed format.');
};

const parseJsonFeed = (json: string): ParsedFeed => {
  const feed = JSON.parse(json) as {
    title?: string;
    home_page_url?: string;
    description?: string;
    items?: Array<{
      id?: string;
      url?: string;
      external_url?: string;
      title?: string;
      summary?: string;
      content_html?: string;
      content_text?: string;
      author?: { name?: string };
      date_published?: string;
      date_modified?: string;
    }>;
  };
  return {
    title: feed.title,
    siteUrl: normalizeLink(feed.home_page_url),
    description: feed.description,
    items: (feed.items ?? []).map((item) => {
      const link = normalizeLink(item.url ?? item.external_url);
      const title = item.title ?? item.summary ?? 'Untitled';
      const publishedAt = normalizeFeedDate(item.date_published);
      return {
        externalId: normalizeItemExternalId({ id: item.id, link, title, publishedAt }),
        title,
        link,
        author: item.author?.name,
        summary: item.summary ?? item.content_text,
        contentHtml: sanitizeHtml(item.content_html ?? item.content_text),
        publishedAt,
        updatedAt: normalizeFeedDate(item.date_modified)
      };
    })
  };
};

const parseRss = (xml: string): ParsedFeed => {
  const channel = firstTag(xml, 'channel') ?? xml;
  const items = allTags(channel, 'item').map((itemXml) => {
    const guid = textOf(itemXml, 'guid');
    const title = textOf(itemXml, 'title') ?? 'Untitled';
    const link = normalizeLink(textOf(itemXml, 'link'));
    const publishedAt = normalizeFeedDate(textOf(itemXml, 'pubDate') ?? textOf(itemXml, 'dc:date'));
    return {
      externalId: normalizeItemExternalId({ guid, link, title, publishedAt }),
      title,
      link,
      author: textOf(itemXml, 'author') ?? textOf(itemXml, 'dc:creator'),
      summary: textOf(itemXml, 'description'),
      contentHtml: sanitizeHtml(rawOf(itemXml, 'content:encoded') ?? rawOf(itemXml, 'description')),
      publishedAt,
      updatedAt: normalizeFeedDate(textOf(itemXml, 'updated'))
    };
  });
  return {
    title: textOf(channel, 'title'),
    siteUrl: normalizeLink(textOf(channel, 'link')),
    description: textOf(channel, 'description'),
    items
  };
};

const parseAtom = (xml: string): ParsedFeed => {
  const entries = allTags(xml, 'entry').map((entryXml) => {
    const id = textOf(entryXml, 'id');
    const title = textOf(entryXml, 'title') ?? 'Untitled';
    const link = normalizeLink(atomLink(entryXml));
    const publishedAt = normalizeFeedDate(
      textOf(entryXml, 'published') ?? textOf(entryXml, 'updated')
    );
    return {
      externalId: normalizeItemExternalId({ id, link, title, publishedAt }),
      title,
      link,
      author: textOf(firstTag(entryXml, 'author') ?? '', 'name'),
      summary: textOf(entryXml, 'summary'),
      contentHtml: sanitizeHtml(rawOf(entryXml, 'content') ?? rawOf(entryXml, 'summary')),
      publishedAt,
      updatedAt: normalizeFeedDate(textOf(entryXml, 'updated'))
    };
  });
  return {
    title: textOf(xml, 'title'),
    siteUrl: normalizeLink(atomLink(xml)),
    description: textOf(xml, 'subtitle'),
    items: entries
  };
};

const stripCdata = (xml: string): string => xml.replaceAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

const allTags = (xml: string, tagName: string): string[] => {
  const escaped = tagName.replaceAll(':', '\\:');
  const matcher = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'gi');
  return [...xml.matchAll(matcher)].map((match) => match[1]);
};

const firstTag = (xml: string, tagName: string): string | undefined => allTags(xml, tagName)[0];

const textOf = (xml: string, tagName: string): string | undefined => {
  const text = decodeEntities(stripTags(firstTag(xml, tagName) ?? '')).trim();
  return text || undefined;
};

const rawOf = (xml: string, tagName: string): string | undefined => {
  const raw = stripCdata(firstTag(xml, tagName) ?? '').trim();
  return raw || undefined;
};

const atomLink = (xml: string): string | undefined => {
  const alternate = [...xml.matchAll(/<link\s+([^>]*?)\/?>/gi)]
    .map((match) => match[1])
    .find((attrs) => !/\brel=["'](self|hub)["']/i.test(attrs));
  return alternate?.match(/\bhref=["']([^"']+)["']/i)?.[1];
};

const sanitizeHtml = (html: string | undefined): string | undefined => {
  if (!html) return undefined;
  const sanitized = html
    .replaceAll(/<script[\s\S]*?<\/script>/gi, '')
    .replaceAll(/<style[\s\S]*?<\/style>/gi, '')
    .replaceAll(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replaceAll(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .trim();
  return sanitized || undefined;
};

const stripTags = (value: string): string => value.replaceAll(/<[^>]+>/g, ' ');

const decodeEntities = (value: string): string =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
