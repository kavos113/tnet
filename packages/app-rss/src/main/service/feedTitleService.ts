import fs from 'node:fs/promises';
import { normalizeRssUrl } from '@tnet/app-rss/shared/rssUrl';
import { parseFeedXml } from './feedParser';

export const fetchRemoteFeedTitle = async (
  url: string,
  options: {
    timeoutSeconds: number;
    userAgent?: string;
  }
): Promise<string | undefined> => {
  const feedUrl = normalizeRssUrl(url);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), options.timeoutSeconds * 1000);
  try {
    const response = await fetch(feedUrl, {
      signal: abortController.signal,
      headers: {
        'user-agent': options.userAgent ?? 'tnet-rss/1.0',
        accept:
          'application/rss+xml, application/atom+xml, application/feed+json, application/json, application/xml, text/xml;q=0.9, */*;q=0.8'
      }
    });
    if (!response.ok) return undefined;
    return parseFeedXml(await response.text()).title;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
};

export const readLocalFeedTitle = async (filePath: string): Promise<string | undefined> => {
  try {
    return parseFeedXml(await fs.readFile(filePath, 'utf8')).title;
  } catch {
    return undefined;
  }
};
