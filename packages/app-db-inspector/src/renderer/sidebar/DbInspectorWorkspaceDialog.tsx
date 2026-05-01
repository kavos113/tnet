import { useEffect, useState } from 'react';
import type { DbInspectorWorkspace } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorWorkspaceDraft } from '../dbInspectorActions';
import styles from '../DbInspectorApp.module.css';

interface DbInspectorWorkspaceDialogProps {
  isOpen: boolean;
  workspace?: DbInspectorWorkspace;
  isLoading: boolean;
  onClose: () => void;
  onPickSqlite: () => Promise<{ path: string; name: string } | null>;
  onSave: (input: DbInspectorWorkspaceDraft) => void;
  onTestConnection: () => void;
}

export const DbInspectorWorkspaceDialog = ({
  isLoading,
  isOpen,
  onClose,
  onPickSqlite,
  onSave,
  onTestConnection,
  workspace
}: DbInspectorWorkspaceDialogProps): React.JSX.Element | null => {
  const [draft, setDraft] = useState<DbInspectorWorkspaceDraft>({
    name: '',
    driver: 'sqlite',
    readOnly: true
  });

  useEffect(() => {
    setDraft(toDraft(workspace));
  }, [workspace]);

  if (!isOpen) return null;

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div
        className={styles.workspaceDialog}
        role="dialog"
        aria-modal="true"
        aria-label="Edit DB workspace"
      >
        <header className={styles.dialogHeader}>
          <strong>{workspace ? 'Edit Workspace' : 'Create Workspace'}</strong>
          <button className={styles.iconButton} type="button" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </header>
        <label className={styles.label}>
          Name
          <input
            className={styles.input}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label className={styles.label}>
          Driver
          <select
            className={styles.select}
            value={draft.driver}
            onChange={(event) =>
              setDraft({
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
          <>
            <label className={styles.label}>
              SQLite path
              <span className={styles.pathRow}>
                <input
                  className={styles.input}
                  value={draft.databasePath ?? ''}
                  onChange={(event) => setDraft({ ...draft, databasePath: event.target.value })}
                />
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => {
                    onPickSqlite().then((selected) => {
                      if (!selected) return;
                      setDraft((current) => ({
                        ...current,
                        databasePath: selected.path,
                        name: current.name || selected.name
                      }));
                    });
                  }}
                >
                  Browse
                </button>
              </span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={draft.readOnly ?? true}
                onChange={(event) => setDraft({ ...draft, readOnly: event.target.checked })}
              />
              Open connection as read-only
            </label>
          </>
        ) : (
          <ServerConnectionFields draft={draft} onDraftChange={setDraft} workspace={workspace} />
        )}
        <footer className={styles.dialogActions}>
          {workspace ? (
            <button
              className={styles.button}
              type="button"
              disabled={isLoading}
              onClick={onTestConnection}
            >
              Test Connection
            </button>
          ) : null}
          <button className={styles.button} type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.button}
            type="button"
            disabled={isLoading}
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

const toDraft = (workspace?: DbInspectorWorkspace): DbInspectorWorkspaceDraft => {
  if (!workspace) return { name: '', driver: 'sqlite', readOnly: true };
  const { connection } = workspace;
  if (connection.driver === 'sqlite') {
    return {
      name: workspace.name,
      driver: 'sqlite',
      databasePath: connection.databasePath,
      readOnly: connection.readOnly
    };
  }
  return {
    name: workspace.name,
    driver: connection.driver,
    host: connection.host,
    port: connection.port,
    database: connection.database,
    username: connection.username,
    sslMode: connection.sslMode,
    password: ''
  };
};

const ServerConnectionFields = ({
  draft,
  onDraftChange,
  workspace
}: {
  draft: DbInspectorWorkspaceDraft;
  onDraftChange: (draft: DbInspectorWorkspaceDraft) => void;
  workspace?: DbInspectorWorkspace;
}): React.JSX.Element => (
  <>
    <label className={styles.label}>
      Host
      <input
        className={styles.input}
        value={draft.host ?? ''}
        onChange={(event) => onDraftChange({ ...draft, host: event.target.value })}
      />
    </label>
    <div className={styles.formGridTwo}>
      <label className={styles.label}>
        Port
        <input
          className={styles.input}
          type="number"
          value={draft.port ?? (draft.driver === 'postgresql' ? 5432 : 3306)}
          onChange={(event) => onDraftChange({ ...draft, port: Number(event.target.value) })}
        />
      </label>
      <label className={styles.label}>
        SSL
        <select
          className={styles.select}
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
        className={styles.input}
        value={draft.database ?? ''}
        onChange={(event) => onDraftChange({ ...draft, database: event.target.value })}
      />
    </label>
    <label className={styles.label}>
      User
      <input
        className={styles.input}
        value={draft.username ?? ''}
        onChange={(event) => onDraftChange({ ...draft, username: event.target.value })}
      />
    </label>
    <label className={styles.label}>
      Password
      <input
        className={styles.input}
        type="password"
        value={draft.password ?? ''}
        onChange={(event) => onDraftChange({ ...draft, password: event.target.value })}
        placeholder={
          workspace?.connection.driver !== 'sqlite' && workspace?.connection.hasPassword
            ? 'Saved password is kept when blank'
            : ''
        }
      />
    </label>
  </>
);
