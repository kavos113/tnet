import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DatabaseColumn,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import {
  exportRowsAsCsv,
  exportRowsAsInsertSql,
  loadAllTableRowsForExport,
  safeExportFileName
} from './exportDbInspectorData';

vi.mock('./dbInspectorTnetApi', () => ({
  dbInspectorTnetApi: {
    dbInspector: {
      tableData: {
        loadPage: vi.fn()
      },
      files: {
        saveTextFile: vi.fn()
      }
    }
  }
}));

const columns: DatabaseColumn[] = [
  { name: 'id', type: 'INTEGER', nullable: false },
  { name: 'name', type: 'TEXT', nullable: true }
];

const tablePage = (rows: Record<string, unknown>[], totalRows: number): TablePageResult => ({
  columns,
  rows,
  page: 0,
  pageSize: 500,
  totalRows
});

describe('exportDbInspectorData', () => {
  beforeEach(() => {
    vi.mocked(dbInspectorTnetApi.dbInspector.tableData.loadPage).mockReset();
    vi.mocked(dbInspectorTnetApi.dbInspector.files.saveTextFile).mockReset();
    Object.defineProperty(window, 'alert', {
      value: vi.fn(),
      configurable: true
    });
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('loads all filtered table rows across export pages', async () => {
    vi.mocked(dbInspectorTnetApi.dbInspector.tableData.loadPage)
      .mockResolvedValueOnce(tablePage([{ id: 1, name: 'Ada' }], 2))
      .mockResolvedValueOnce(tablePage([{ id: 2, name: 'Grace' }], 2));

    const result = await loadAllTableRowsForExport(
      { workspaceId: 'w1', tableName: 'authors', whereClause: 'id > 0' },
      []
    );

    expect(result.rows).toEqual([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' }
    ]);
    expect(dbInspectorTnetApi.dbInspector.tableData.loadPage).toHaveBeenNthCalledWith(1, {
      workspaceId: 'w1',
      tableName: 'authors',
      whereClause: 'id > 0',
      page: 0,
      pageSize: 500
    });
    expect(dbInspectorTnetApi.dbInspector.tableData.loadPage).toHaveBeenNthCalledWith(2, {
      workspaceId: 'w1',
      tableName: 'authors',
      whereClause: 'id > 0',
      page: 1,
      pageSize: 500
    });
  });

  it('uses fallback columns when the first export page has no column metadata', async () => {
    vi.mocked(dbInspectorTnetApi.dbInspector.tableData.loadPage).mockResolvedValueOnce({
      ...tablePage([], 0),
      columns: []
    });

    await expect(
      loadAllTableRowsForExport({ workspaceId: 'w1', tableName: 'empty' }, columns)
    ).resolves.toMatchObject({ columns });
  });

  it('exports rows as CSV and alerts when a file was saved', async () => {
    vi.mocked(dbInspectorTnetApi.dbInspector.files.saveTextFile).mockResolvedValue({
      path: 'authors.csv'
    });

    await exportRowsAsCsv({
      columns,
      rows: [{ id: 1, name: 'Ada' }],
      defaultPath: 'authors.csv'
    });

    expect(dbInspectorTnetApi.dbInspector.files.saveTextFile).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: 'authors.csv',
        content: expect.stringMatching(/^id,name\r?\n1,Ada$/)
      })
    );
    expect(window.alert).toHaveBeenCalledWith('Exported: authors.csv');
  });

  it('exports rows as INSERT SQL without alerting when save is cancelled', async () => {
    vi.mocked(dbInspectorTnetApi.dbInspector.files.saveTextFile).mockResolvedValue(null);

    await exportRowsAsInsertSql({
      columns,
      rows: [{ id: 1, name: 'Ada' }],
      dialect: 'sqlite',
      tableName: 'authors',
      defaultPath: 'authors.sql'
    });

    expect(dbInspectorTnetApi.dbInspector.files.saveTextFile).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: 'authors.sql',
        content: 'INSERT INTO "authors" ("id", "name") VALUES\n  (1, \'Ada\');'
      })
    );
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('sanitizes unsafe export file names', () => {
    expect(safeExportFileName(' reports/2026:Q1* ', 'csv')).toBe('reports_2026_Q1_.csv');
    expect(safeExportFileName('   ', 'sql')).toBe('export.sql');
  });
});
