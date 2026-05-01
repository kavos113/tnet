import { useMemo, useState } from 'react';
import type { DatabaseTable } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import {
  setDbInspectorActiveTable,
  setDbInspectorError,
  setDbInspectorLoading,
  setDbInspectorSchema,
  setDbInspectorWorkspace
} from './dbInspectorSlice';
import { useDbInspectorDispatch, useDbInspectorSelector } from './storeHooks';
import styles from './DbInspectorApp.module.css';

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
  const [workspaceName, setWorkspaceName] = useState('');
  const [databasePath, setDatabasePath] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [activeWorkspaceId, workspaces]
  );

  const appStyle = {
    '--db-inspector-grid-font-family': globalSettings.gridFontFamily || undefined,
    '--db-inspector-grid-font-size': globalSettings.gridFontSize
      ? `${globalSettings.gridFontSize}px`
      : undefined
  } as React.CSSProperties;

  const refreshWorkspace = async (workspaceId: string): Promise<void> => {
    const [nextWorkspaces, nextSchema, nextSettings] = await Promise.all([
      dbInspectorTnetApi.dbInspector.workspaces.list(),
      dbInspectorTnetApi.dbInspector.schema.getTree({ workspaceId }),
      dbInspectorTnetApi.dbInspector.workspaces.getSettings({ workspaceId })
    ]);
    dispatch(
      setDbInspectorWorkspace({
        activeWorkspaceId: workspaceId,
        workspaces: nextWorkspaces,
        schema: nextSchema ?? undefined,
        settings: nextSettings
      })
    );
  };

  const handleCreateWorkspace = async (): Promise<void> => {
    if (!databasePath.trim()) {
      dispatch(setDbInspectorError('SQLite database path is required.'));
      return;
    }
    dispatch(setDbInspectorLoading(true));
    try {
      const workspace = await dbInspectorTnetApi.dbInspector.workspaces.create({
        name: workspaceName,
        databasePath,
        readOnly: true
      });
      const refreshedSchema = await dbInspectorTnetApi.dbInspector.schema.refresh({
        workspaceId: workspace.id
      });
      const nextWorkspaces = await dbInspectorTnetApi.dbInspector.workspaces.list();
      dispatch(
        setDbInspectorWorkspace({
          activeWorkspaceId: workspace.id,
          workspaces: nextWorkspaces,
          schema: refreshedSchema
        })
      );
      setWorkspaceName('');
      setDatabasePath('');
      dispatch(setDbInspectorError(undefined));
    } catch (createError) {
      dispatch(
        setDbInspectorError(
          createError instanceof Error ? createError.message : String(createError)
        )
      );
    } finally {
      dispatch(setDbInspectorLoading(false));
    }
  };

  const handleSelectWorkspace = async (workspaceId: string): Promise<void> => {
    dispatch(setDbInspectorLoading(true));
    try {
      await refreshWorkspace(workspaceId);
      dispatch(setDbInspectorError(undefined));
    } catch (selectError) {
      dispatch(
        setDbInspectorError(
          selectError instanceof Error ? selectError.message : String(selectError)
        )
      );
    } finally {
      dispatch(setDbInspectorLoading(false));
    }
  };

  const handlePickSqlite = async (): Promise<void> => {
    const selected = await dbInspectorTnetApi.dbInspector.files.selectSqliteDatabase();
    if (!selected) return;
    setDatabasePath(selected.path);
    setWorkspaceName((current) => current || selected.name);
  };

  const handleRefreshSchema = async (): Promise<void> => {
    if (!activeWorkspaceId) return;
    dispatch(setDbInspectorLoading(true));
    try {
      const refreshedSchema = await dbInspectorTnetApi.dbInspector.schema.refresh({
        workspaceId: activeWorkspaceId
      });
      dispatch(setDbInspectorSchema(refreshedSchema));
      dispatch(setDbInspectorError(undefined));
    } catch (refreshError) {
      dispatch(
        setDbInspectorError(
          refreshError instanceof Error ? refreshError.message : String(refreshError)
        )
      );
    } finally {
      dispatch(setDbInspectorLoading(false));
    }
  };

  const handleOpenTable = async (table: DatabaseTable, nextPage = 0): Promise<void> => {
    if (!activeWorkspaceId) return;
    dispatch(setDbInspectorLoading(true));
    try {
      const pageResult = await dbInspectorTnetApi.dbInspector.tableData.loadPage({
        workspaceId: activeWorkspaceId,
        schemaName: table.schemaName,
        tableName: table.name,
        page: nextPage,
        pageSize: settings.tablePageSize || globalSettings.defaultPageSize || 100,
        filter
      });
      dispatch(setDbInspectorActiveTable({ tableName: table.name, table: pageResult }));
      setPage(nextPage);
      dispatch(setDbInspectorError(undefined));
    } catch (tableError) {
      dispatch(
        setDbInspectorError(tableError instanceof Error ? tableError.message : String(tableError))
      );
    } finally {
      dispatch(setDbInspectorLoading(false));
    }
  };

  const activeTableModel = schema?.schemas
    .flatMap((databaseSchema) => databaseSchema.tables)
    .find((table) => table.name === activeTableName);

  return (
    <div className={styles.app} style={appStyle} role="main" aria-label="DB Inspector">
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.title}>DB Inspector</h2>
          <button
            className={styles.iconButton}
            type="button"
            title="Refresh schema"
            disabled={!activeWorkspaceId || isLoading}
            onClick={() => void handleRefreshSchema()}
          >
            <span className="material-icons">refresh</span>
          </button>
        </div>
        <select
          className={styles.select}
          value={activeWorkspaceId ?? ''}
          onChange={(event) => void handleSelectWorkspace(event.target.value)}
        >
          <option value="">Select database</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        <div className={styles.workspaceForm}>
          <label className={styles.label}>
            Name
            <input
              className={styles.input}
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Local database"
            />
          </label>
          <label className={styles.label}>
            SQLite path
            <span className={styles.pathRow}>
              <input
                className={styles.input}
                value={databasePath}
                onChange={(event) => setDatabasePath(event.target.value)}
                placeholder="C:\\path\\database.db"
              />
              <button
                className={styles.button}
                type="button"
                onClick={() => void handlePickSqlite()}
              >
                Browse
              </button>
            </span>
          </label>
          <button
            className={styles.button}
            type="button"
            disabled={isLoading}
            onClick={() => void handleCreateWorkspace()}
          >
            Add SQLite Workspace
          </button>
        </div>
        <div className={styles.schemaTree}>
          {schema?.schemas.map((databaseSchema) => (
            <div key={databaseSchema.name} className={styles.schemaGroup}>
              <div className={styles.schemaName}>{databaseSchema.name}</div>
              {databaseSchema.tables.map((table) => (
                <button
                  key={table.name}
                  className={styles.treeButton}
                  type="button"
                  onClick={() => void handleOpenTable(table, 0)}
                >
                  <span className="material-icons">table_chart</span>
                  {table.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div>
            <strong>{activeWorkspace?.name ?? 'No database selected'}</strong>
            {activeWorkspace ? ` · ${activeWorkspace.connection.databasePath}` : ''}
          </div>
          <span>{settings.readOnlyMode ? 'Read only' : 'Writable'}</span>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
        <div className={styles.content}>
          {!activeTable ? (
            <div className={styles.empty}>Select a table from the schema tree.</div>
          ) : (
            <div className={styles.tableShell}>
              <div className={styles.tableToolbar}>
                <strong>{activeTableName}</strong>
                <input
                  className={styles.input}
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter"
                />
                <button
                  className={styles.button}
                  type="button"
                  disabled={!activeTableModel || isLoading}
                  onClick={() => activeTableModel && void handleOpenTable(activeTableModel, 0)}
                >
                  Apply
                </button>
                <span>{activeTable.totalRows} rows</span>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      {activeTable.columns.map((column) => (
                        <th key={column.name}>{column.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTable.rows.map((row, index) => (
                      <tr key={index}>
                        {activeTable.columns.map((column) => (
                          <td key={column.name}>{formatCell(row[column.name])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagingRow}>
                <button
                  className={styles.button}
                  type="button"
                  disabled={!activeTableModel || page === 0 || isLoading}
                  onClick={() =>
                    activeTableModel && void handleOpenTable(activeTableModel, page - 1)
                  }
                >
                  Previous
                </button>
                <span>Page {page + 1}</span>
                <button
                  className={styles.button}
                  type="button"
                  disabled={
                    !activeTableModel ||
                    isLoading ||
                    (page + 1) * activeTable.pageSize >= activeTable.totalRows
                  }
                  onClick={() =>
                    activeTableModel && void handleOpenTable(activeTableModel, page + 1)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const formatCell = (value: unknown): string => {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
