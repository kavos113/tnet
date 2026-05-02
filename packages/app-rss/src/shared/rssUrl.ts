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
