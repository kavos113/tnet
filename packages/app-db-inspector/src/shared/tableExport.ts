import type { DatabaseColumn } from './dbInspectorTypes';

export const rowsToCsv = (columns: DatabaseColumn[], rows: Record<string, unknown>[]): string => {
  const header = columns.map((column) => escapeCsvCell(column.name)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvCell(formatExportValue(row[column.name]))).join(',')
  );
  return [header, ...body].join('\n');
};

export const rowToTsv = (columns: DatabaseColumn[], row: Record<string, unknown>): string =>
  columns.map((column) => formatExportValue(row[column.name])).join('\t');

export const formatExportValue = (value: unknown): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const escapeCsvCell = (value: string): string => {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
};
