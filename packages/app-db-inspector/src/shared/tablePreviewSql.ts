import type { DatabaseTable } from './dbInspectorTypes';
import { assertSingleStatement } from './sqlModel';

export interface ParsedTablePreviewSql {
  whereClause?: string;
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

export const quoteSqlIdentifier = (identifier: string): string =>
  `"${identifier.replace(/"/g, '""')}"`;

export const buildTablePreviewSql = (
  table: DatabaseTable,
  sort?: { column: string; direction: 'asc' | 'desc' },
  whereClause?: string
): string => {
  const tableName =
    table.schemaName && table.schemaName !== 'main'
      ? `${quoteSqlIdentifier(table.schemaName)}.${quoteSqlIdentifier(table.name)}`
      : quoteSqlIdentifier(table.name);
  const whereSql = whereClause?.trim() ? ` WHERE ${whereClause.trim()}` : '';
  const orderBy = sort
    ? ` ORDER BY ${quoteSqlIdentifier(sort.column)} ${sort.direction.toUpperCase()}`
    : '';
  return `SELECT * FROM ${tableName}${whereSql}${orderBy}`;
};

export const parseTablePreviewSql = (
  sqlText: string,
  table: DatabaseTable
): ParsedTablePreviewSql => {
  assertSingleStatement(sqlText);
  const normalizedSql = sqlText.trim().replace(/;\s*$/, '');
  if (!/^select\s+/i.test(normalizedSql)) {
    throw new Error('Table preview SQL must be a SELECT statement.');
  }

  const fromIndex = findKeywordIndex(normalizedSql, 'from');
  if (fromIndex < 0) throw new Error('Table preview SQL must include FROM.');

  const afterFrom = normalizedSql.slice(fromIndex + 4).trimStart();
  const expectedReferences = tableReferences(table);
  const matchedReference = expectedReferences.find((reference) =>
    startsWithReference(afterFrom, reference)
  );
  if (!matchedReference) {
    throw new Error(`Table preview SQL must select from ${table.name}.`);
  }

  const afterTable = afterFrom.slice(matchedReference.length).trimStart();
  const whereIndex = findKeywordIndex(afterTable, 'where');
  const orderByIndex = findOrderByIndex(afterTable);
  const whereClause =
    whereIndex >= 0
      ? afterTable.slice(whereIndex + 5, orderByIndex >= 0 ? orderByIndex : undefined).trim() ||
        undefined
      : undefined;
  const orderByText =
    orderByIndex >= 0 ? afterTable.slice(orderByIndex + 'order by'.length).trim() : '';

  return {
    whereClause,
    sort: parseSimpleOrderBy(orderByText, table)
  };
};

const tableReferences = (table: DatabaseTable): string[] => {
  const quotedName = quoteSqlIdentifier(table.name);
  if (table.schemaName && table.schemaName !== 'main') {
    return [
      `${quoteSqlIdentifier(table.schemaName)}.${quotedName}`,
      `${table.schemaName}.${table.name}`,
      quotedName,
      table.name
    ];
  }
  return [quotedName, table.name];
};

const startsWithReference = (text: string, reference: string): boolean => {
  const candidate = text.slice(0, reference.length);
  const next = text[reference.length];
  return candidate.toLowerCase() === reference.toLowerCase() && (!next || /\s/.test(next));
};

const findKeywordIndex = (text: string, keyword: string): number => {
  const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
  return text.search(pattern);
};

const findOrderByIndex = (text: string): number => text.search(/\border\s+by\b/i);

const parseSimpleOrderBy = (
  orderByText: string,
  table: DatabaseTable
): ParsedTablePreviewSql['sort'] => {
  if (!orderByText) return undefined;
  const match = orderByText.match(/^"([^"]+)"|^([a-zA-Z_][\w]*)/);
  const column = match?.[1] ?? match?.[2];
  if (!column || !table.columns.some((candidate) => candidate.name === column)) return undefined;
  const tail = orderByText.slice(match?.[0].length ?? 0).trimStart();
  const direction = /^desc\b/i.test(tail) ? 'desc' : 'asc';
  return { column, direction };
};
