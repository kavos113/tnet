import type { DatabaseColumn, DbInspectorDriverType } from './dbInspectorTypes';

export interface InsertSqlExportInput {
  dialect: DbInspectorDriverType;
  schemaName?: string;
  tableName: string;
  columns: DatabaseColumn[];
  rows: Record<string, unknown>[];
  mode?: 'multi-row' | 'one-row-per-statement';
}

export const rowsToInsertSql = ({
  columns,
  dialect,
  mode = 'multi-row',
  rows,
  schemaName,
  tableName
}: InsertSqlExportInput): string => {
  const tableRef = quoteTableRef(dialect, schemaName, tableName);
  const columnList = columns.map((column) => quoteIdentifier(dialect, column.name)).join(', ');
  if (rows.length === 0) return '';

  const valueRows = rows.map(
    (row) => `(${columns.map((column) => toSqlLiteral(row[column.name], dialect)).join(', ')})`
  );

  if (mode === 'one-row-per-statement') {
    return valueRows
      .map((values) => `INSERT INTO ${tableRef} (${columnList}) VALUES ${values};`)
      .join('\n');
  }

  return `INSERT INTO ${tableRef} (${columnList}) VALUES\n  ${valueRows.join(',\n  ')};`;
};

export const quoteIdentifier = (dialect: DbInspectorDriverType, identifier: string): string => {
  if (dialect === 'mysql') return `\`${identifier.replace(/`/g, '``')}\``;
  return `"${identifier.replace(/"/g, '""')}"`;
};

export const toSqlLiteral = (value: unknown, dialect: DbInspectorDriverType): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'boolean')
    return dialect === 'mysql' ? (value ? 'TRUE' : 'FALSE') : value ? 'TRUE' : 'FALSE';
  if (value instanceof Uint8Array) return binaryLiteral(value, dialect);
  if (typeof value === 'object') return stringLiteral(JSON.stringify(value));
  return stringLiteral(String(value));
};

const quoteTableRef = (
  dialect: DbInspectorDriverType,
  schemaName: string | undefined,
  tableName: string
): string =>
  schemaName
    ? `${quoteIdentifier(dialect, schemaName)}.${quoteIdentifier(dialect, tableName)}`
    : quoteIdentifier(dialect, tableName);

const stringLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const binaryLiteral = (value: Uint8Array, dialect: DbInspectorDriverType): string => {
  const hex = [...value].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (dialect === 'postgresql') return `decode('${hex}', 'hex')`;
  return `X'${hex}'`;
};
