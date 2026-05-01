import type {
  DatabaseColumn,
  DatabaseSchemaSnapshot,
  QueryExecutionResult,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';

export const resultColumns = (rows: Record<string, unknown>[]): DatabaseColumn[] =>
  Object.keys(rows[0] ?? {}).map((name) => ({ name, type: '', nullable: true }));

export const limitedQueryResult = (
  rows: Record<string, unknown>[],
  startedAt: number,
  maxRows = 500
): QueryExecutionResult => {
  const limit = Math.max(maxRows, 1);
  return {
    columns: resultColumns(rows),
    rows: rows.slice(0, limit),
    durationMs: Math.round(performance.now() - startedAt),
    truncated: rows.length > limit
  };
};

export const emptySchema = (): DatabaseSchemaSnapshot => ({
  refreshedAt: new Date().toISOString(),
  schemas: []
});

export const tablePage = (
  columns: DatabaseColumn[],
  rows: Record<string, unknown>[],
  page: number,
  pageSize: number,
  totalRows: number
): TablePageResult => ({ columns, rows, page, pageSize, totalRows });
