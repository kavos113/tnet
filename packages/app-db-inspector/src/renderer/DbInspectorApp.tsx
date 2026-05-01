import { useMemo, useState } from 'react';
import type { DatabaseTable } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import { openDbInspectorTable } from './dbInspectorActions';
import { useDbInspectorDispatch, useDbInspectorSelector } from './storeHooks';
import { QueryConsole } from './query/QueryConsole';
import { DbInspectorTableGrid } from './table/DbInspectorTableGrid';
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
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | undefined>();

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [activeWorkspaceId, workspaces]
  );
  const activeTableModel = schema?.schemas
    .flatMap((databaseSchema) => databaseSchema.tables)
    .find((table) => table.name === activeTableName);

  const appStyle = {
    '--db-inspector-grid-font-family': globalSettings.gridFontFamily || undefined,
    '--db-inspector-grid-font-size': globalSettings.gridFontSize
      ? `${globalSettings.gridFontSize}px`
      : undefined
  } as React.CSSProperties;

  const handleOpenTable = (table: DatabaseTable, nextPage: number): void => {
    setPage(nextPage);
    void openDbInspectorTable(dispatch, {
      table,
      page: nextPage,
      filter,
      sort,
      activeWorkspaceId,
      settings,
      globalSettings
    });
  };

  const handleSortChange = (nextSort: typeof sort): void => {
    setSort(nextSort);
    if (!activeTableModel || !nextSort) return;
    setPage(0);
    void openDbInspectorTable(dispatch, {
      table: activeTableModel,
      page: 0,
      filter,
      sort: nextSort,
      activeWorkspaceId,
      settings,
      globalSettings
    });
  };

  return (
    <main className={styles.app} style={appStyle} role="main" aria-label="DB Inspector">
      <div className={styles.toolbar}>
        <div className={styles.workspaceSummary}>
          <strong>{activeWorkspace?.name ?? 'No database selected'}</strong>
          {activeWorkspace ? <span>{activeWorkspace.connection.databasePath}</span> : null}
        </div>
        <span className={styles.modeBadge}>{settings.readOnlyMode ? 'Read only' : 'Writable'}</span>
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.content}>
        <div className={styles.workspaceBody}>
          {!activeTable ? (
            <div className={styles.empty}>Select a table from the schema tree.</div>
          ) : (
            <DbInspectorTableGrid
              activeTable={activeTable}
              activeTableModel={activeTableModel}
              activeTableName={activeTableName}
              filter={filter}
              sort={sort}
              page={page}
              isLoading={isLoading}
              onFilterChange={setFilter}
              onSortChange={handleSortChange}
              onOpenTable={handleOpenTable}
            />
          )}
          <QueryConsole />
        </div>
      </div>
    </main>
  );
};
