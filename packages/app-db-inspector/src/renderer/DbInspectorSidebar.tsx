import { useState } from 'react';
import type { DatabaseTable } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import {
  createSqliteWorkspace,
  openDbInspectorTable,
  refreshDbInspectorSchema,
  selectDbInspectorWorkspace
} from './dbInspectorActions';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import { useDbInspectorDispatch, useDbInspectorSelector } from './storeHooks';
import { DbInspectorSchemaTree } from './sidebar/DbInspectorSchemaTree';
import { DbInspectorWorkspaceForm } from './sidebar/DbInspectorWorkspaceForm';
import styles from './DbInspectorApp.module.css';

export const DbInspectorSidebar = (): React.JSX.Element => {
  const dispatch = useDbInspectorDispatch();
  const {
    activeTableName,
    activeWorkspaceId,
    globalSettings,
    isLoading,
    schema,
    settings,
    workspaces
  } = useDbInspectorSelector((state) => state.dbInspector);
  const [workspaceName, setWorkspaceName] = useState('');
  const [databasePath, setDatabasePath] = useState('');
  const [filter] = useState('');

  const handleCreateWorkspace = async (): Promise<void> => {
    const workspace = await createSqliteWorkspace(dispatch, { name: workspaceName, databasePath });
    if (!workspace) return;
    setWorkspaceName('');
    setDatabasePath('');
  };

  const handlePickSqlite = async (): Promise<void> => {
    const selected = await dbInspectorTnetApi.dbInspector.files.selectSqliteDatabase();
    if (!selected) return;
    setDatabasePath(selected.path);
    setWorkspaceName((current) => current || selected.name);
  };

  const handleOpenTable = (table: DatabaseTable, page: number): void => {
    void openDbInspectorTable(dispatch, {
      table,
      page,
      filter,
      activeWorkspaceId,
      settings,
      globalSettings
    });
  };

  return (
    <aside className={styles.sidebar} aria-label="DB Inspector explorer">
      <div className={styles.sidebarHeader}>
        <h2 className={styles.title}>DB Inspector</h2>
        <button
          className={styles.iconButton}
          type="button"
          title="Refresh schema"
          disabled={!activeWorkspaceId || isLoading}
          onClick={() => void refreshDbInspectorSchema(dispatch, activeWorkspaceId)}
        >
          <span className="material-icons">refresh</span>
        </button>
      </div>
      <div className={styles.workspaceTree} role="tree" aria-label="DB workspaces">
        <div className={styles.treeFolder}>
          <span className="material-icons">folder</span>
          Workspaces
        </div>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            className={`${styles.workspaceTreeButton} ${
              activeWorkspaceId === workspace.id ? styles.treeButtonActive : ''
            }`}
            type="button"
            role="treeitem"
            title={workspace.connection.databasePath}
            onClick={() => void selectDbInspectorWorkspace(dispatch, workspace.id)}
          >
            <span className="material-icons">database</span>
            <span className={styles.treeLabel}>{workspace.name}</span>
          </button>
        ))}
      </div>
      <DbInspectorWorkspaceForm
        workspaceName={workspaceName}
        databasePath={databasePath}
        isLoading={isLoading}
        onWorkspaceNameChange={setWorkspaceName}
        onDatabasePathChange={setDatabasePath}
        onPickSqlite={() => void handlePickSqlite()}
        onCreateWorkspace={() => void handleCreateWorkspace()}
      />
      <DbInspectorSchemaTree
        schema={schema}
        activeTableName={activeTableName}
        onOpenTable={handleOpenTable}
      />
    </aside>
  );
};
