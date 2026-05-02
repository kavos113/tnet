import { DOMParser } from '@xmldom/xmldom';
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
  const document = parseXmlDocument(xml);
  const rootName = document.documentElement?.localName.toLowerCase();
  const rootTagName = document.documentElement?.tagName.toLowerCase();
  if (rootName === 'feed') return parseAtom(document);
  if (rootName === 'rss' || rootName === 'rdf' || rootTagName === 'rdf:rdf') {
    return parseRss(document);
  }
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

const parseRss = (document: Document): ParsedFeed => {
  const channel = firstElement(document, 'channel') ?? document.documentElement;
  const items = elements(document, 'item').map((itemElement) => {
    const guid = textOf(itemElement, 'guid');
    const title = textOf(itemElement, 'title') ?? 'Untitled';
    const link = normalizeLink(textOf(itemElement, 'link'));
    const publishedAt = normalizeFeedDate(
      textOf(itemElement, 'pubDate') ?? textOf(itemElement, 'dc:date')
    );
    return {
      externalId: normalizeItemExternalId({ guid, link, title, publishedAt }),
      title,
      link,
      author: textOf(itemElement, 'author') ?? textOf(itemElement, 'dc:creator'),
      summary: textOf(itemElement, 'description'),
      contentHtml: sanitizeHtml(
        rawOf(itemElement, 'content:encoded') ?? rawOf(itemElement, 'description')
      ),
      publishedAt,
      updatedAt: normalizeFeedDate(textOf(itemElement, 'updated'))
    };
  });
  return {
    title: textOf(channel, 'title'),
    siteUrl: normalizeLink(textOf(channel, 'link')),
    description: textOf(channel, 'description'),
    items
  };
};

const parseAtom = (document: Document): ParsedFeed => {
  const entries = elements(document, 'entry').map((entryElement) => {
    const id = textOf(entryElement, 'id');
    const title = textOf(entryElement, 'title') ?? 'Untitled';
    const link = normalizeLink(atomLink(entryElement));
    const publishedAt = normalizeFeedDate(
      textOf(entryElement, 'published') ?? textOf(entryElement, 'updated')
    );
    return {
      externalId: normalizeItemExternalId({ id, link, title, publishedAt }),
      title,
      link,
      author: textOf(firstElement(entryElement, 'author'), 'name'),
      summary: textOf(entryElement, 'summary'),
      contentHtml: sanitizeHtml(rawOf(entryElement, 'content') ?? rawOf(entryElement, 'summary')),
      publishedAt,
      updatedAt: normalizeFeedDate(textOf(entryElement, 'updated'))
    };
  });
  return {
    title: textOf(document.documentElement, 'title'),
    siteUrl: normalizeLink(atomLink(document.documentElement)),
    description: textOf(document.documentElement, 'subtitle'),
    items: entries
  };
};

const parseXmlDocument = (xml: string): Document => {
  const errors: string[] = [];
  const document = new DOMParser({
    errorHandler: {
      warning: (message) => errors.push(String(message)),
      error: (message) => errors.push(String(message)),
      fatalError: (message) => errors.push(String(message))
    }
  }).parseFromString(xml, 'application/xml');
  if (!document.documentElement || errors.length > 0) {
    throw new Error(`Invalid feed XML: ${errors.join('; ') || 'missing document element'}`);
  }
  return document;
};

const elements = (root: Document | Element, tagName: string): Element[] =>
  Array.from(root.getElementsByTagName(tagName));

const firstElement = (
  root: Document | Element | undefined | null,
  tagName: string
): Element | undefined => {
  if (!root) return undefined;
  return elements(root, tagName)[0];
};

const textOf = (
  root: Document | Element | undefined | null,
  tagName: string
): string | undefined => {
  const text = firstElement(root, tagName)?.textContent?.trim();
  return text || undefined;
};

const rawOf = (root: Document | Element, tagName: string): string | undefined => {
  const raw = firstElement(root, tagName)?.textContent?.trim();
  return raw || undefined;
};

const atomLink = (element: Element): string | undefined => {
  const links = elements(element, 'link');
  const alternate = links.find((link) => {
    const rel = link.getAttribute('rel');
    return rel !== 'self' && rel !== 'hub';
  });
  return alternate?.getAttribute('href') ?? undefined;
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
