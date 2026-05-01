import type { DatabaseSchemaSnapshot, DbInspectorDriverType } from './dbInspectorTypes';

export type SqlCompletionKind = 'keyword' | 'schema' | 'table' | 'column';
export type SqlCompletionContextKind = 'keyword' | 'table' | 'column';

export interface SqlCompletionItem {
  label: string;
  apply: string;
  kind: SqlCompletionKind;
  detail?: string;
}

export interface SqlCompletionContext {
  kind: SqlCompletionContextKind;
  from: number;
  prefix: string;
  qualifier?: string;
  aliases: Record<string, string>;
}

const TABLE_CONTEXT_KEYWORDS = new Set(['from', 'join', 'update', 'into']);
const COLUMN_CONTEXT_KEYWORDS = new Set(['select', 'where', 'by', 'on', 'set', 'and', 'or']);

export const sqlKeywords = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT JOIN',
  'INNER JOIN',
  'ORDER BY',
  'GROUP BY',
  'LIMIT',
  'OFFSET',
  'INSERT INTO',
  'UPDATE',
  'DELETE FROM',
  'VALUES',
  'SET',
  'AND',
  'OR',
  'IS NULL',
  'IS NOT NULL'
];

export const getSqlCompletionContext = (
  sqlText: string,
  cursorPosition: number
): SqlCompletionContext => {
  const beforeCursor = sqlText.slice(0, cursorPosition);
  const wordMatch = /[A-Za-z0-9_]*$/.exec(beforeCursor);
  const prefix = wordMatch?.[0] ?? '';
  const from = cursorPosition - prefix.length;
  const qualifierMatch = /("[^"]+"|`[^`]+`|[A-Za-z_][A-Za-z0-9_]*)\.\s*[A-Za-z0-9_]*$/.exec(
    beforeCursor
  );
  const aliases = extractTableAliases(beforeCursor);
  if (qualifierMatch) {
    return {
      kind: 'column',
      from,
      prefix,
      qualifier: unquoteIdentifier(qualifierMatch[1]),
      aliases
    };
  }

  const previousKeyword = previousWord(beforeCursor.slice(0, from)).toLowerCase();
  if (TABLE_CONTEXT_KEYWORDS.has(previousKeyword)) return { kind: 'table', from, prefix, aliases };
  if (COLUMN_CONTEXT_KEYWORDS.has(previousKeyword))
    return { kind: 'column', from, prefix, aliases };
  return { kind: 'keyword', from, prefix, aliases };
};

export const buildSqlCompletionItems = (input: {
  context: SqlCompletionContext;
  dialect: DbInspectorDriverType;
  schema?: DatabaseSchemaSnapshot;
}): SqlCompletionItem[] => {
  let candidates: SqlCompletionItem[];
  if (input.context.kind === 'table') {
    candidates = tableCompletionItems(input.schema, input.dialect);
  } else if (input.context.kind === 'column') {
    candidates = columnCompletionItems(
      input.schema,
      input.dialect,
      input.context.qualifier,
      input.context.aliases
    );
  } else {
    candidates = [
      ...keywordCompletionItems(),
      ...tableCompletionItems(input.schema, input.dialect),
      ...columnCompletionItems(input.schema, input.dialect, undefined, input.context.aliases)
    ];
  }

  return candidates.filter((item) =>
    item.label.toLowerCase().startsWith(input.context.prefix.toLowerCase())
  );
};

const keywordCompletionItems = (): SqlCompletionItem[] =>
  sqlKeywords.map((keyword) => ({
    label: keyword,
    apply: keyword,
    kind: 'keyword'
  }));

const tableCompletionItems = (
  schema: DatabaseSchemaSnapshot | undefined,
  dialect: DbInspectorDriverType
): SqlCompletionItem[] =>
  schema?.schemas.flatMap((databaseSchema) =>
    databaseSchema.tables.map((table) => ({
      label: table.name,
      apply: quoteIdentifier(dialect, table.name),
      kind: 'table' as const,
      detail: databaseSchema.name
    }))
  ) ?? [];

const columnCompletionItems = (
  schema: DatabaseSchemaSnapshot | undefined,
  dialect: DbInspectorDriverType,
  qualifier: string | undefined,
  aliases: Record<string, string>
): SqlCompletionItem[] => {
  const resolvedTableName = qualifier ? (aliases[qualifier] ?? qualifier) : undefined;
  return (
    schema?.schemas.flatMap((databaseSchema) =>
      databaseSchema.tables
        .filter((table) => !resolvedTableName || table.name === resolvedTableName)
        .flatMap((table) =>
          table.columns.map((column) => ({
            label: column.name,
            apply: quoteIdentifier(dialect, column.name),
            kind: 'column' as const,
            detail: table.name
          }))
        )
    ) ?? []
  );
};

const quoteIdentifier = (dialect: DbInspectorDriverType, identifier: string): string => {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) return identifier;
  if (dialect === 'mysql') return `\`${identifier.replace(/`/g, '``')}\``;
  return `"${identifier.replace(/"/g, '""')}"`;
};

const previousWord = (value: string): string => {
  const words = value.match(/[A-Za-z_]+/g);
  return words?.at(-1) ?? '';
};

const unquoteIdentifier = (value: string): string =>
  value
    .replace(/^["`]|["`]$/g, '')
    .replace(/""/g, '"')
    .replace(/``/g, '`');

const extractTableAliases = (sqlText: string): Record<string, string> => {
  const aliases: Record<string, string> = {};
  const tablePattern =
    /\b(?:from|join)\s+("[^"]+"|`[^`]+`|[A-Za-z_][A-Za-z0-9_]*)(?:\s+(?:as\s+)?([A-Za-z_][A-Za-z0-9_]*))?/gi;
  for (const match of sqlText.matchAll(tablePattern)) {
    const tableName = unquoteIdentifier(match[1]);
    aliases[tableName] = tableName;
    if (match[2] && !SQL_ALIAS_STOP_WORDS.has(match[2].toLowerCase())) {
      aliases[match[2]] = tableName;
    }
  }
  return aliases;
};

const SQL_ALIAS_STOP_WORDS = new Set(['where', 'join', 'left', 'inner', 'right', 'full', 'on']);
