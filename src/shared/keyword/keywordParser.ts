const keywordRegex = /<keyword([\s\S]*?)>([\s\S]*?)<\/keyword>/g;
const keywordNameRegex = /name="([^"]*)"/;
const keywordNumberClassRegex = /number-class="([^"]*)"/;
const keywordPrefixRegex = /prefix="([^"]*)"/;

export interface KeywordMatch {
  attr: string;
  content: string;
  name: string;
  noindex: boolean;
  numberClass?: string;
  prefix?: string;
}

export const parseKeywords = (content: string): KeywordMatch[] => {
  keywordRegex.lastIndex = 0;
  const matches: KeywordMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = keywordRegex.exec(content)) !== null) {
    const attr = match[1] ?? '';
    const inner = match[2] ?? '';
    const name = keywordNameRegex.exec(attr)?.[1] ?? '';
    const numberClass = keywordNumberClassRegex.exec(attr)?.[1];
    const prefix = keywordPrefixRegex.exec(attr)?.[1];

    matches.push({
      attr,
      content: inner,
      name,
      noindex: attr.includes('noindex'),
      numberClass,
      prefix
    });
  }

  return matches;
};

export const extractKeywordContent = (content: string, name: string): string | null => {
  const found = parseKeywords(content).find((keyword) => keyword.name === name);
  return found?.content ?? null;
};

const ensureLeadingSpace = (attr: string): string => {
  if (attr === '') return '';
  return /^\s/.test(attr) ? attr : ` ${attr}`;
};

const appendAttribute = (attr: string, fragment: string): string => {
  const normalized = ensureLeadingSpace(attr);
  const spacer = normalized === '' || /\s$/.test(normalized) ? '' : ' ';
  return `${normalized}${spacer}${fragment}`;
};

const escapeAttributeValue = (value: string): string => value.replaceAll('"', '&quot;');

export const injectKeywordNames = (
  content: string,
  getNextName: (numberClass: string, prefix: string) => string
): string => {
  const localKeywordRegex = /<keyword([\s\S]*?)>([\s\S]*?)<\/keyword>/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = localKeywordRegex.exec(content)) !== null) {
    const whole = match[0];
    const attr = match[1] ?? '';
    const inner = match[2] ?? '';
    result += content.slice(lastIndex, match.index);

    let nextAttr = ensureLeadingSpace(attr);
    if (!keywordNameRegex.test(nextAttr)) {
      const numberClass = keywordNumberClassRegex.exec(nextAttr)?.[1];
      if (numberClass) {
        const prefix = keywordPrefixRegex.exec(nextAttr)?.[1] ?? '命題';
        nextAttr = appendAttribute(
          nextAttr,
          `name="${escapeAttributeValue(getNextName(numberClass, prefix))}"`
        );
      }
    }

    result += `<keyword${nextAttr}>${inner}</keyword>`;
    lastIndex = match.index + whole.length;
  }

  return result + content.slice(lastIndex);
};
