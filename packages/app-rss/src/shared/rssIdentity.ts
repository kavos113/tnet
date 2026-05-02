export const normalizeItemExternalId = (input: {
  guid?: string;
  id?: string;
  link?: string;
  title?: string;
  publishedAt?: string;
}): string => {
  const explicitId = normalizeText(input.guid) ?? normalizeText(input.id);
  if (explicitId) return explicitId;
  const link = normalizeLink(input.link);
  if (link) return link;
  const title = normalizeText(input.title) ?? 'untitled';
  return `${title}:${input.publishedAt ?? ''}`;
};

export const normalizeLink = (link: string | undefined): string | undefined => {
  if (!link) return undefined;
  try {
    const url = new URL(link.trim());
    url.hash = '';
    return url.toString();
  } catch {
    return normalizeText(link);
  }
};

const normalizeText = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};
