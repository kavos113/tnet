export interface BibtexPaperMetadata {
  entryType?: string;
  title?: string;
  authors?: string[];
  abstract?: string;
  publishedYear?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
}

export interface BibtexParseDiagnostic {
  severity: 'error' | 'warning';
  message: string;
}

export interface BibtexParseResult {
  metadata: BibtexPaperMetadata;
  diagnostics: BibtexParseDiagnostic[];
}

export const parseBibtexMetadata = (input: string): BibtexPaperMetadata => {
  return parseBibtexMetadataResult(input).metadata;
};

export const parseBibtexMetadataResult = (input: string): BibtexParseResult => {
  const entry = bibtexEntry(input);
  if (!entry.body) {
    return {
      metadata: {},
      diagnostics: input.trim()
        ? [{ severity: 'error', message: entry.error ?? 'BibTeX entry could not be parsed.' }]
        : []
    };
  }

  const fields = parseBibtexFields(entry.body);
  const metadata: BibtexPaperMetadata = {
    entryType: entry.entryType,
    title: cleanBibtexValue(fields.get('title')),
    authors: parseAuthors(fields.get('author')),
    abstract: cleanBibtexValue(fields.get('abstract')),
    publishedYear: parseYear(fields.get('year')) ?? parseYear(fields.get('date')),
    venue: cleanBibtexValue(
      fields.get('journal') ??
        fields.get('booktitle') ??
        fields.get('conference') ??
        fields.get('venue')
    ),
    doi: cleanBibtexValue(fields.get('doi')),
    arxivId: parseArxivId(fields),
    url: cleanBibtexValue(fields.get('url'))
  };

  const parsedMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
    )
  ) as BibtexPaperMetadata;

  return {
    metadata: parsedMetadata,
    diagnostics: parsedMetadata.title
      ? []
      : [{ severity: 'warning', message: 'BibTeX entry does not include a title.' }]
  };
};

const bibtexEntry = (input: string): { entryType?: string; body: string; error?: string } => {
  const trimmed = input.trim();
  if (!trimmed) return { body: '' };
  if (!trimmed.startsWith('@')) {
    return { body: '', error: 'BibTeX entry must start with @.' };
  }

  const start = input.indexOf('{');
  const end = input.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return { body: '', error: 'BibTeX entry is missing braces.' };
  }

  const entryType =
    input
      .slice(input.indexOf('@') + 1, start)
      .trim()
      .toLowerCase() || undefined;
  const firstComma = input.indexOf(',', start);
  if (firstComma < 0 || firstComma >= end) {
    return { entryType, body: '', error: 'BibTeX entry is missing the citation key separator.' };
  }
  return { entryType, body: input.slice(firstComma + 1, end) };
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
    ?.replaceAll(/[{}]/g, '')
    .replaceAll(/\\([&%_$#{}])/g, '$1')
    .replaceAll(/\\([`'"^~=.])\{?([A-Za-z])\}?/g, (_, accent: string, letter: string) =>
      applyLatexAccent(accent, letter)
    )
    .replaceAll(/\s+/g, ' ')
    .trim();
  return cleaned || undefined;
};

const parseAuthors = (value?: string): string[] | undefined => {
  const authors = splitBibtexAuthors(value ?? '')
    .map((author) => cleanBibtexValue(author))
    .filter((author): author is string => Boolean(author))
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

const splitBibtexAuthors = (value: string): string[] => {
  const authors: string[] = [];
  let depth = 0;
  let current = '';
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '{') depth++;
    if (char === '}') depth = Math.max(0, depth - 1);

    const rest = value.slice(index);
    const separator = rest.match(/^\s+and\s+/i);
    if (depth === 0 && separator) {
      authors.push(current);
      current = '';
      index += separator[0].length - 1;
      continue;
    }
    current += char;
  }
  if (current.trim()) authors.push(current);
  return authors;
};

const applyLatexAccent = (accent: string, letter: string): string => {
  const lower = letter.toLowerCase();
  const table: Record<string, Record<string, string>> = {
    "'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý' },
    '`': { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' },
    '"': { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', y: 'ÿ' },
    '^': { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û' },
    '~': { a: 'ã', n: 'ñ', o: 'õ' },
    '=': { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' },
    '.': { z: 'ż' }
  };
  const converted = table[accent]?.[lower];
  if (!converted) return letter;
  return letter === lower ? converted : converted.toUpperCase();
};
