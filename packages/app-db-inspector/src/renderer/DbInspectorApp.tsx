import { useEffect, useMemo, useState } from 'react';
import type {
  DatabaseColumn,
  DatabaseTable,
  DbInspectorWorkspace
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import {
  buildTablePreviewSql,
  parseTablePreviewSql
} from '@tnet/app-db-inspector/shared/tablePreviewSql';
import { openDbInspectorTable } from './dbInspectorActions';
import { setDbInspectorError } from './dbInspectorSlice';
import {
  exportRowsAsCsv,
  exportRowsAsInsertSql,
  loadAllTableRowsForExport,
  safeExportFileName
} from './exportDbInspectorData';
import { useDbInspectorDispatch, useDbInspectorSelector } from './storeHooks';
import { QueryConsole } from './query/QueryConsole';
import { DbInspectorTableGrid } from './table/DbInspectorTableGrid';
import { ErDiagramView } from './diagram/ErDiagramView';
import styles from './DbInspectorApp.module.css';
import sharedStyles from './DbInspectorShared.module.css';

type DbInspectorMainView = 'table' | 'schema-er' | 'table-er';

export const DbInspectorApp = (): React.JSX.Element => {
  const dispatch = useDbInspectorDispatch();
  const {
    activeWorkspaceId,
    activeTable,
    activeTableName,
    error,
    globalSettings,
    isLoading,
    schema,
    settings,
    workspaces
  } = useDbInspectorSelector((state) => state.dbInspector);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | undefined>();
  const [previewSql, setPreviewSql] = useState('SELECT * FROM ');
  const [mainView, setMainView] = useState<DbInspectorMainView>('table');

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [activeWorkspaceId, workspaces]
  );
  const activeTableModel = schema?.schemas
    .flatMap((databaseSchema) => databaseSchema.tables)
    .find((table) => table.name === activeTableName);
  const activeSchemaName = activeTableModel?.schemaName ?? schema?.schemas[0]?.name;

  const appStyle = {
    '--db-inspector-grid-font-family': globalSettings.gridFontFamily || undefined,
    '--db-inspector-grid-font-size': globalSettings.gridFontSize
      ? `${globalSettings.gridFontSize}px`
      : undefined,
    '--db-inspector-query-font-family': globalSettings.queryFontFamily || undefined
  } as React.CSSProperties;

  useEffect(() => {
    if (!activeTableModel) return;
    setPreviewSql(buildTablePreviewSql(activeTableModel, sort));
  }, [activeTableModel, sort]);

  const handleOpenTable = (table: DatabaseTable, nextPage: number): void => {
    setPage(nextPage);
    const parsedSql = parsePreviewSqlOrReport(table);
    if (!parsedSql) return;
    setSort(parsedSql.sort);
    void openDbInspectorTable(dispatch, {
      table,
      page: nextPage,
      filter: '',
      sort: parsedSql.sort,
      whereClause: parsedSql.whereClause,
      activeWorkspaceId,
      settings,
      globalSettings
    });
  };

  const handleSortChange = (nextSort: typeof sort): void => {
    setSort(nextSort);
    if (!activeTableModel || !nextSort) return;
    const parsedSql = parsePreviewSqlOrReport(activeTableModel);
    if (!parsedSql) return;
    const nextPreviewSql = buildTablePreviewSql(activeTableModel, nextSort, parsedSql.whereClause);
    setPreviewSql(nextPreviewSql);
    setPage(0);
    void openDbInspectorTable(dispatch, {
      table: activeTableModel,
      page: 0,
      filter: '',
      sort: nextSort,
      whereClause: parsedSql.whereClause,
      activeWorkspaceId,
      settings,
      globalSettings
    });
  };

  const parsePreviewSqlOrReport = (
    table: DatabaseTable
  ): ReturnType<typeof parseTablePreviewSql> | undefined => {
    try {
      const parsedSql = parseTablePreviewSql(previewSql, table);
      dispatch(setDbInspectorError(undefined));
      return parsedSql;
    } catch (parseError) {
      dispatch(
        setDbInspectorError(parseError instanceof Error ? parseError.message : String(parseError))
      );
      return undefined;
    }
  };

  const loadAllFilteredRowsForActiveTable = async (): Promise<
    | {
        columns: DatabaseColumn[];
        rows: Record<string, unknown>[];
      }
    | undefined
  > => {
    if (!activeWorkspaceId || !activeTable || !activeTableModel) return undefined;
    const parsedSql = parsePreviewSqlOrReport(activeTableModel);
    if (!parsedSql) return undefined;
    const result = await loadAllTableRowsForExport(
      {
        workspaceId: activeWorkspaceId,
        schemaName: activeTableModel.schemaName,
        tableName: activeTableModel.name,
        sort: parsedSql.sort,
        whereClause: parsedSql.whereClause,
        filter: ''
      },
      activeTable.columns
    );
    return { columns: result.columns, rows: result.rows };
  };

  const handleExportTableCsv = (): void => {
    if (!activeTableModel) return;
    void loadAllFilteredRowsForActiveTable()
      .then((result) => {
        if (!result) return;
        return exportRowsAsCsv({
          columns: result.columns,
          rows: result.rows,
          defaultPath: safeExportFileName(activeTableModel.name, 'csv')
        });
      })
      .catch((exportError) => {
        dispatch(
          setDbInspectorError(
            exportError instanceof Error ? exportError.message : String(exportError)
          )
        );
      });
  };

  const handleExportTableInsert = (): void => {
    if (!activeTableModel) return;
    void loadAllFilteredRowsForActiveTable()
      .then((result) => {
        if (!result) return;
        return exportRowsAsInsertSql({
          columns: result.columns,
          rows: result.rows,
          dialect: activeWorkspace?.driver ?? 'sqlite',
          tableName: activeTableModel.name,
          schemaName: activeTableModel.schemaName,
          defaultPath: safeExportFileName(`${activeTableModel.name}-insert`, 'sql')
        });
      })
      .catch((exportError) => {
        dispatch(
          setDbInspectorError(
            exportError instanceof Error ? exportError.message : String(exportError)
          )
        );
      });
  };

  return (
    <main className={styles.app} style={appStyle} role="main" aria-label="DB Inspector">
      <div className={styles.toolbar}>
        <div className={styles.workspaceSummary}>
          <strong>{activeWorkspace?.name ?? 'No database selected'}</strong>
          {activeWorkspace ? <span>{describeConnection(activeWorkspace)}</span> : null}
        </div>
        <div className={sharedStyles.segmentedControl} aria-label="DB Inspector view">
          <button
            className={mainView === 'table' ? sharedStyles.segmentedActive : ''}
            type="button"
            aria-pressed={mainView === 'table'}
            onClick={() => setMainView('table')}
          >
            Table
          </button>
          <button
            className={mainView === 'schema-er' ? sharedStyles.segmentedActive : ''}
            type="button"
            aria-pressed={mainView === 'schema-er'}
            disabled={!schema}
            onClick={() => setMainView('schema-er')}
          >
            Schema ER
          </button>
          <button
            className={mainView === 'table-er' ? sharedStyles.segmentedActive : ''}
            type="button"
            aria-pressed={mainView === 'table-er'}
            disabled={!schema || !activeTableName}
            onClick={() => setMainView('table-er')}
          >
            Table ER
          </button>
        </div>
        <span className={styles.modeBadge}>{settings.readOnlyMode ? 'Read only' : 'Writable'}</span>
      </div>
      {error ? <div className={sharedStyles.error}>{error}</div> : null}
      <div className={styles.content}>
        <div className={styles.workspaceBody}>
          {mainView === 'schema-er' && schema ? (
            <ErDiagramView schema={schema} schemaName={activeSchemaName} />
          ) : mainView === 'table-er' && schema ? (
            <ErDiagramView
              schema={schema}
              schemaName={activeSchemaName}
              tableName={activeTableName}
            />
          ) : !activeTable ? (
            <div className={sharedStyles.empty}>Select a table from the schema tree.</div>
          ) : (
            <DbInspectorTableGrid
              activeTable={activeTable}
              activeTableModel={activeTableModel}
              activeTableName={activeTableName}
              previewSql={previewSql}
              sort={sort}
              page={page}
              isLoading={isLoading}
              onPreviewSqlChange={setPreviewSql}
              onSortChange={handleSortChange}
              onOpenTable={handleOpenTable}
              onExportCsv={handleExportTableCsv}
              onExportInsert={handleExportTableInsert}
            />
          )}
          <QueryConsole />
        </div>
      </div>
    </main>
  );
};

const describeConnection = (workspace: DbInspectorWorkspace): string => {
  const { connection } = workspace;
  if (connection.driver === 'sqlite') return connection.databasePath;
  return `${connection.driver}://${connection.username}@${connection.host}:${connection.port}/${connection.database}`;
};
