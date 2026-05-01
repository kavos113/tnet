import styles from '../DbInspectorApp.module.css';

interface DbInspectorWorkspaceFormProps {
  workspaceName: string;
  databasePath: string;
  isLoading: boolean;
  onWorkspaceNameChange: (name: string) => void;
  onDatabasePathChange: (path: string) => void;
  onPickSqlite: () => void;
  onCreateWorkspace: () => void;
}

export const DbInspectorWorkspaceForm = ({
  databasePath,
  isLoading,
  onCreateWorkspace,
  onDatabasePathChange,
  onPickSqlite,
  onWorkspaceNameChange,
  workspaceName
}: DbInspectorWorkspaceFormProps): React.JSX.Element => (
  <div className={styles.workspaceForm}>
    <label className={styles.label}>
      Name
      <input
        className={styles.input}
        value={workspaceName}
        onChange={(event) => onWorkspaceNameChange(event.target.value)}
        placeholder="Local database"
      />
    </label>
    <label className={styles.label}>
      SQLite path
      <span className={styles.pathRow}>
        <input
          className={styles.input}
          value={databasePath}
          onChange={(event) => onDatabasePathChange(event.target.value)}
          placeholder="C:\\path\\database.db"
        />
        <button className={styles.button} type="button" onClick={onPickSqlite}>
          Browse
        </button>
      </span>
    </label>
    <button
      className={styles.button}
      type="button"
      disabled={isLoading}
      onClick={onCreateWorkspace}
    >
      Add SQLite Workspace
    </button>
  </div>
);
