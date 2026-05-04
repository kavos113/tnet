export const normalizeRssUrl = (value: string): string => {
  const url = new URL(value.trim());
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('RSS feed URL must use http or https.');
  }
  url.hash = '';
  return url.toString();
};

export const isValidRssUrl = (value: string): boolean => {
  try {
    normalizeRssUrl(value);
    return true;
  } catch {
    return false;
  }
};

export interface ParseRssUrlListResult {
  urls: string[];
  invalidLines: string[];
}

export const parseRssUrlList = (value: string): ParseRssUrlListResult => {
  const urls: string[] = [];
  const seenUrls = new Set<string>();
  const invalidLines: string[] = [];

  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      try {
        const url = normalizeRssUrl(line);
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          urls.push(url);
        }
      } catch {
        invalidLines.push(line);
      }
    });

  return { urls, invalidLines };
};
