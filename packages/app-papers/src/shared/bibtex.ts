export interface BibtexPaperMetadata {
  title?: string;
  authors?: string[];
  abstract?: string;
  publishedYear?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
}

export const parseBibtexMetadata = (input: string): BibtexPaperMetadata => {
  const body = bibtexBody(input);
  if (!body) return {};

  const fields = parseBibtexFields(body);
  const metadata: BibtexPaperMetadata = {
    title: cleanBibtexValue(fields.get('title')),
    authors: parseAuthors(fields.get('author')),
    abstract: cleanBibtexValue(fields.get('abstract')),
    publishedYear: parseYear(fields.get('year')),
    venue: cleanBibtexValue(fields.get('journal') ?? fields.get('booktitle')),
    doi: cleanBibtexValue(fields.get('doi')),
    arxivId: parseArxivId(fields),
    url: cleanBibtexValue(fields.get('url'))
  };

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
    )
  ) as BibtexPaperMetadata;
};

const bibtexBody = (input: string): string => {
  const start = input.indexOf('{');
  const end = input.lastIndexOf('}');
  if (!input.trim().startsWith('@') || start < 0 || end <= start) return '';
  const firstComma = input.indexOf(',', start);
  if (firstComma < 0 || firstComma >= end) return '';
  return input.slice(firstComma + 1, end);
};

const parseBibtexFields = (body: string): Map<string, string> => {
  const fields = new Map<string, string>();
  let index = 0;
  while (index < body.length) {
    while (index < body.length && /[\s,]/.test(body[index])) index++;
    const keyStart = index;
    while (index < body.length && /[A-Za-z0-9_:-]/.test(body[index])) index++;
    const key = body.slice(keyStart, index).toLowerCase();
    while (index < body.length && /\s/.test(body[index])) index++;
    if (!key || body[index] !== '=') {
      index++;
      continue;
    }
    index++;
    while (index < body.length && /\s/.test(body[index])) index++;
    const parsed = readBibtexValue(body, index);
    if (!parsed) break;
    fields.set(key, parsed.value);
    index = parsed.nextIndex;
  }
  return fields;
};

const readBibtexValue = (
  body: string,
  start: number
): { value: string; nextIndex: number } | null => {
  const opener = body[start];
  if (opener === '{') return readBalancedValue(body, start, '{', '}');
  if (opener === '"') return readQuotedValue(body, start);

  let index = start;
  while (index < body.length && body[index] !== ',') index++;
  return { value: body.slice(start, index), nextIndex: index + 1 };
};

const readQuotedValue = (body: string, start: number): { value: string; nextIndex: number } => {
  let index = start + 1;
  for (; index < body.length; index++) {
    if (body[index] === '"' && body[index - 1] !== '\\') {
      return { value: body.slice(start + 1, index), nextIndex: index + 1 };
    }
  }
  return { value: body.slice(start + 1), nextIndex: body.length };
};

const readBalancedValue = (
  body: string,
  start: number,
  opener: string,
  closer: string
): { value: string; nextIndex: number } => {
  let depth = 0;
  let index = start;
  for (; index < body.length; index++) {
    const char = body[index];
    if (char === opener && opener !== closer) depth++;
    if (char === closer) {
      if (opener === closer || depth === 1) {
        return { value: body.slice(start + 1, index), nextIndex: index + 1 };
      }
      depth--;
    }
  }
  return { value: body.slice(start + 1), nextIndex: body.length };
};

const cleanBibtexValue = (value?: string): string | undefined => {
  const cleaned = value
    ?.replaceAll(/\{([^{}]*)\}/g, '$1')
    .replaceAll(/\s+/g, ' ')
    .trim();
  return cleaned || undefined;
};

const parseAuthors = (value?: string): string[] | undefined => {
  const authors = cleanBibtexValue(value)
    ?.split(/\s+and\s+/i)
    .map((author) => author.trim())
    .filter(Boolean);
  return authors && authors.length > 0 ? authors : undefined;
};

const parseYear = (value?: string): number | undefined => {
  const match = cleanBibtexValue(value)?.match(/\d{4}/);
  return match ? Number(match[0]) : undefined;
};

const parseArxivId = (fields: Map<string, string>): string | undefined => {
  const archivePrefix = cleanBibtexValue(fields.get('archiveprefix'))?.toLowerCase();
  const eprint = cleanBibtexValue(fields.get('eprint'));
  if (archivePrefix === 'arxiv') return eprint;
  return undefined;
};
