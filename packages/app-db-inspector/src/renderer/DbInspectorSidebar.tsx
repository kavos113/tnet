import { useState } from 'react';
import type { DatabaseTable } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import {
  createSqliteWorkspace,
  openDbInspectorTable,
  refreshDbInspectorSchema,
  selectDbInspectorWorkspace,
  testDbInspectorConnection,
  updateSqliteWorkspace
} from './dbInspectorActions';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import { useDbInspectorDispatch, useDbInspectorSelector } from './storeHooks';
import { DbInspectorSchemaTree } from './sidebar/DbInspectorSchemaTree';
import { DbInspectorWorkspaceDialog } from './sidebar/DbInspectorWorkspaceDialog';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter] = useState('');
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  const handleCreateWorkspace = async (): Promise<void> => {
    const workspace = await createSqliteWorkspace(dispatch, { name: workspaceName, databasePath });
    if (!workspace) return;
    setWorkspaceName('');
    setDatabasePath('');
  };

  const handlePickSqlite = async (): Promise<void> => {
    return pickSqliteFile().then((selected) => {
      if (!selected) return;
      setDatabasePath(selected.path);
      setWorkspaceName((current) => current || selected.name);
    });
  };

  const pickSqliteFile = async (): Promise<{ path: string; name: string } | null> => {
    const selected = await dbInspectorTnetApi.dbInspector.files.selectSqliteDatabase();
    return selected;
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
        <button
          className={styles.iconButton}
          type="button"
          title="Edit workspace"
          disabled={!activeWorkspace || isLoading}
          onClick={() => setIsEditDialogOpen(true)}
        >
          <span className="material-icons">settings</span>
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
      <DbInspectorWorkspaceDialog
        isOpen={isEditDialogOpen}
        workspace={activeWorkspace}
        isLoading={isLoading}
        onClose={() => setIsEditDialogOpen(false)}
        onPickSqlite={pickSqliteFile}
        onTestConnection={() => {
          void testDbInspectorConnection(dispatch, activeWorkspaceId).then((ok) => {
            if (ok) window.alert('Connection succeeded.');
          });
        }}
        onSave={(input) => {
          void updateSqliteWorkspace(dispatch, {
            workspaceId: activeWorkspaceId,
            name: input.name,
            databasePath: input.databasePath,
            readOnly: input.readOnly
          }).then((workspace) => {
            if (workspace) setIsEditDialogOpen(false);
          });
        }}
      />
    </aside>
  );
};
