import type {
  DatabaseColumn,
  DbInspectorDriverType,
  LoadTablePageRequest,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { rowsToInsertSql } from '@tnet/app-db-inspector/shared/insertSqlExport';
import { rowsToCsv } from '@tnet/app-db-inspector/shared/tableExport';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';

const EXPORT_PAGE_SIZE = 500;

export const loadAllTableRowsForExport = async (
  request: Omit<LoadTablePageRequest, 'page' | 'pageSize'>,
  fallbackColumns: DatabaseColumn[]
): Promise<Pick<TablePageResult, 'columns' | 'rows' | 'totalRows'>> => {
  const firstPage = await dbInspectorTnetApi.dbInspector.tableData.loadPage({
    ...request,
    page: 0,
    pageSize: EXPORT_PAGE_SIZE
  });
  const rows = [...firstPage.rows];
  const columns = firstPage.columns.length > 0 ? firstPage.columns : fallbackColumns;
  let nextPage = 1;

  while (rows.length < firstPage.totalRows) {
    const pageResult = await dbInspectorTnetApi.dbInspector.tableData.loadPage({
      ...request,
      page: nextPage,
      pageSize: EXPORT_PAGE_SIZE
    });
    if (pageResult.rows.length === 0) break;
    rows.push(...pageResult.rows);
    nextPage += 1;
  }

  return { columns, rows, totalRows: firstPage.totalRows };
};

export const exportRowsAsCsv = async (input: {
  columns: DatabaseColumn[];
  rows: Record<string, unknown>[];
  defaultPath: string;
}): Promise<void> => {
  const content = rowsToCsv(input.columns, input.rows);
  const result = await dbInspectorTnetApi.dbInspector.files.saveTextFile({
    defaultPath: input.defaultPath,
    content,
    filters: [
      { name: 'CSV', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result) window.alert(`Exported: ${result.path}`);
};

export const exportRowsAsInsertSql = async (input: {
  columns: DatabaseColumn[];
  rows: Record<string, unknown>[];
  dialect: DbInspectorDriverType;
  tableName: string;
  schemaName?: string;
  defaultPath: string;
}): Promise<void> => {
  const content = rowsToInsertSql({
    columns: input.columns,
    rows: input.rows,
    dialect: input.dialect,
    tableName: input.tableName,
    schemaName: input.schemaName
  });
  const result = await dbInspectorTnetApi.dbInspector.files.saveTextFile({
    defaultPath: input.defaultPath,
    content,
    filters: [
      { name: 'SQL', extensions: ['sql'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result) window.alert(`Exported: ${result.path}`);
};

export const safeExportFileName = (value: string, extension: string): string => {
  const baseName =
    [...value.trim()].map((char) => (isSafeFileNameChar(char) ? char : '_')).join('') || 'export';
  return `${baseName}.${extension}`;
};

const isSafeFileNameChar = (char: string): boolean => {
  if (char.charCodeAt(0) < 32) return false;
  return !'<>:"/\\|?*'.includes(char);
};
