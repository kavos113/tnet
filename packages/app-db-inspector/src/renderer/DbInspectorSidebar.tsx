import { useState } from 'react';
import type {
  DatabaseTable,
  DbInspectorWorkspace
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import {
  createDbInspectorWorkspace,
  type DbInspectorWorkspaceDraft,
  openDbInspectorTable,
  refreshDbInspectorSchema,
  selectDbInspectorWorkspace,
  testDbInspectorConnection,
  updateDbInspectorWorkspace
} from './dbInspectorActions';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import { useDbInspectorDispatch, useDbInspectorSelector } from './storeHooks';
import { DbInspectorSchemaTree } from './sidebar/DbInspectorSchemaTree';
import { DbInspectorWorkspaceDialog } from './sidebar/DbInspectorWorkspaceDialog';
import { DbInspectorWorkspaceForm } from './sidebar/DbInspectorWorkspaceForm';
import appStyles from './DbInspectorShared.module.css';
import styles from './sidebar/DbInspectorSidebar.module.css';
import treeStyles from './sidebar/DbInspectorSidebarTree.module.css';

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
  const [workspaceDraft, setWorkspaceDraft] = useState<DbInspectorWorkspaceDraft>({
    name: '',
    driver: 'sqlite',
    databasePath: '',
    readOnly: true
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  const handleCreateWorkspace = async (): Promise<void> => {
    const workspace = await createDbInspectorWorkspace(dispatch, workspaceDraft);
    if (!workspace) return;
    setWorkspaceDraft({
      name: '',
      driver: 'sqlite',
      databasePath: '',
      readOnly: true
    });
  };

  const handlePickSqlite = async (): Promise<void> => {
    return pickSqliteFile().then((selected) => {
      if (!selected) return;
      setWorkspaceDraft((current) => ({
        ...current,
        databasePath: selected.path,
        name: current.name || selected.name
      }));
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
      filter: '',
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
          className={appStyles.iconButton}
          type="button"
          title="Refresh schema"
          disabled={!activeWorkspaceId || isLoading}
          onClick={() => void refreshDbInspectorSchema(dispatch, activeWorkspaceId)}
        >
          <span className="material-icons">refresh</span>
        </button>
        <button
          className={appStyles.iconButton}
          type="button"
          title="Edit workspace"
          disabled={!activeWorkspace || isLoading}
          onClick={() => setIsEditDialogOpen(true)}
        >
          <span className="material-icons">settings</span>
        </button>
      </div>
      <div className={treeStyles.workspaceTree} role="tree" aria-label="DB workspaces">
        <div className={treeStyles.treeFolder}>
          <span className="material-icons">folder</span>
          Workspaces
        </div>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            className={`${treeStyles.workspaceTreeButton} ${
              activeWorkspaceId === workspace.id ? treeStyles.treeButtonActive : ''
            }`}
            type="button"
            role="treeitem"
            title={describeConnection(workspace)}
            onClick={() => void selectDbInspectorWorkspace(dispatch, workspace.id)}
          >
            <span className="material-icons">storage</span>
            <span className={treeStyles.treeLabel}>{workspace.name}</span>
          </button>
        ))}
      </div>
      <DbInspectorWorkspaceForm
        draft={workspaceDraft}
        isLoading={isLoading}
        onDraftChange={setWorkspaceDraft}
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
          void updateDbInspectorWorkspace(dispatch, {
            workspaceId: activeWorkspaceId,
            ...input
          }).then((workspace) => {
            if (workspace) setIsEditDialogOpen(false);
          });
        }}
      />
    </aside>
  );
};

const describeConnection = (workspace: DbInspectorWorkspace): string => {
  const { connection } = workspace;
  if (connection.driver === 'sqlite') return connection.databasePath;
  return `${connection.username}@${connection.host}:${connection.port}/${connection.database}`;
};
