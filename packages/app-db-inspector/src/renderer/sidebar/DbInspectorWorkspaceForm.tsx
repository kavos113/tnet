import type { DbInspectorWorkspaceDraft } from '../dbInspectorActions';
import appStyles from '../DbInspectorApp.module.css';
import styles from './DbInspectorSidebar.module.css';

interface DbInspectorWorkspaceFormProps {
  draft: DbInspectorWorkspaceDraft;
  isLoading: boolean;
  onDraftChange: (draft: DbInspectorWorkspaceDraft) => void;
  onPickSqlite: () => void;
  onCreateWorkspace: () => void;
}

export const DbInspectorWorkspaceForm = ({
  draft,
  isLoading,
  onCreateWorkspace,
  onDraftChange,
  onPickSqlite
}: DbInspectorWorkspaceFormProps): React.JSX.Element => (
  <div className={styles.workspaceForm}>
    <label className={styles.label}>
      Name
      <input
        className={appStyles.input}
        value={draft.name}
        onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
        placeholder="Local database"
      />
    </label>
    <label className={styles.label}>
      Driver
      <select
        className={appStyles.select}
        value={draft.driver}
        onChange={(event) =>
          onDraftChange({
            ...draft,
            driver: event.target.value as DbInspectorWorkspaceDraft['driver']
          })
        }
      >
        <option value="sqlite">SQLite</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="mysql">MySQL</option>
      </select>
    </label>
    {draft.driver === 'sqlite' ? (
      <label className={styles.label}>
        SQLite path
        <span className={styles.pathRow}>
          <input
            className={appStyles.input}
            value={draft.databasePath ?? ''}
            onChange={(event) => onDraftChange({ ...draft, databasePath: event.target.value })}
            placeholder="C:\\path\\database.db"
          />
          <button className={appStyles.button} type="button" onClick={onPickSqlite}>
            Browse
          </button>
        </span>
      </label>
    ) : (
      <ConnectionFields draft={draft} onDraftChange={onDraftChange} />
    )}
    <button
      className={appStyles.button}
      type="button"
      disabled={isLoading}
      onClick={onCreateWorkspace}
    >
      Add Workspace
    </button>
  </div>
);

const ConnectionFields = ({
  draft,
  onDraftChange
}: {
  draft: DbInspectorWorkspaceDraft;
  onDraftChange: (draft: DbInspectorWorkspaceDraft) => void;
}): React.JSX.Element => (
  <>
    <label className={styles.label}>
      Host
      <input
        className={appStyles.input}
        value={draft.host ?? ''}
        onChange={(event) => onDraftChange({ ...draft, host: event.target.value })}
        placeholder="localhost"
      />
    </label>
    <div className={styles.formGridTwo}>
      <label className={styles.label}>
        Port
        <input
          className={appStyles.input}
          type="number"
          value={draft.port ?? (draft.driver === 'postgresql' ? 5432 : 3306)}
          onChange={(event) => onDraftChange({ ...draft, port: Number(event.target.value) })}
        />
      </label>
      <label className={styles.label}>
        SSL
        <select
          className={appStyles.select}
          value={draft.sslMode ?? (draft.driver === 'postgresql' ? 'prefer' : 'disable')}
          onChange={(event) => onDraftChange({ ...draft, sslMode: event.target.value })}
        >
          {draft.driver === 'postgresql' ? <option value="prefer">Prefer</option> : null}
          <option value="disable">Disable</option>
          <option value="require">Require</option>
        </select>
      </label>
    </div>
    <label className={styles.label}>
      Database
      <input
        className={appStyles.input}
        value={draft.database ?? ''}
        onChange={(event) => onDraftChange({ ...draft, database: event.target.value })}
      />
    </label>
    <label className={styles.label}>
      User
      <input
        className={appStyles.input}
        value={draft.username ?? ''}
        onChange={(event) => onDraftChange({ ...draft, username: event.target.value })}
      />
    </label>
    <label className={styles.label}>
      Password
      <input
        className={appStyles.input}
        type="password"
        value={draft.password ?? ''}
        onChange={(event) => onDraftChange({ ...draft, password: event.target.value })}
        placeholder="Leave blank to keep existing"
      />
    </label>
  </>
);
