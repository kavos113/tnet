import type {
  RequesterExtractionRule,
  RequesterResponseSnapshot
} from '@tnet/app-requester/shared/requesterTypes';

export interface ExtractedVariable {
  key: string;
  value: string;
}

export const extractVariablesFromResponse = (
  rules: RequesterExtractionRule[] | undefined,
  response: RequesterResponseSnapshot
): ExtractedVariable[] => {
  if (!rules?.length) return [];

  return rules.flatMap((rule): ExtractedVariable[] => {
    if (!rule.enabled || !rule.targetVariable.trim()) return [];

    const value = safelyExtractRuleValue(rule, response);
    if (value === undefined) return [];

    return [
      {
        key: rule.targetVariable.trim(),
        value: stringifyExtractedValue(value)
      }
    ];
  });
};

const safelyExtractRuleValue = (
  rule: RequesterExtractionRule,
  response: RequesterResponseSnapshot
): unknown => {
  try {
    return rule.source === 'header'
      ? extractHeader(response, rule.expression)
      : extractJsonPath(response.bodyText, rule.expression);
  } catch {
    return undefined;
  }
};

const extractHeader = (
  response: RequesterResponseSnapshot,
  expression: string
): string | undefined => {
  const headerName = expression.trim().toLowerCase();
  if (!headerName) return undefined;
  return response.headers.find((header) => header.key.toLowerCase() === headerName)?.value;
};

const extractJsonPath = (bodyText: string, expression: string): unknown => {
  if (!expression.startsWith('$')) return undefined;

  let current: unknown = JSON.parse(bodyText);
  for (const segment of tokenizeJsonPath(expression)) {
    if (current === undefined || current === null) return undefined;
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
      continue;
    }

    if (typeof current !== 'object' || !(segment in current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
};

const tokenizeJsonPath = (expression: string): Array<string | number> => {
  const tokens: Array<string | number> = [];
  const matcher = /\.([A-Za-z_][A-Za-z0-9_]*)|\[(\d+)\]/g;
  let cursor = 1;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(expression)) !== null) {
    if (match.index !== cursor) throw new Error(`Unsupported JSONPath expression: ${expression}`);
    tokens.push(match[1] ?? Number(match[2]));
    cursor = matcher.lastIndex;
  }

  if (cursor !== expression.length) {
    throw new Error(`Unsupported JSONPath expression: ${expression}`);
  }

  return tokens;
};

const stringifyExtractedValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};
