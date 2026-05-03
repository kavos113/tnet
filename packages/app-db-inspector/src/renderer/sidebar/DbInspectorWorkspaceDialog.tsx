import { useEffect, useState } from 'react';
import type { DbInspectorWorkspace } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type { DbInspectorWorkspaceDraft } from '../dbInspectorActions';
import appStyles from '../DbInspectorShared.module.css';
import dialogStyles from './DbInspectorWorkspaceDialog.module.css';
import styles from './DbInspectorWorkspaceForm.module.css';

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
    <div className={dialogStyles.dialogBackdrop} role="presentation">
      <div
        className={dialogStyles.workspaceDialog}
        role="dialog"
        aria-modal="true"
        aria-label="Edit DB workspace"
      >
        <header className={dialogStyles.dialogHeader}>
          <strong>{workspace ? 'Edit Workspace' : 'Create Workspace'}</strong>
          <button className={appStyles.iconButton} type="button" onClick={onClose}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </header>
        <label className={styles.label}>
          Name
          <input
            className={appStyles.input}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label className={styles.label}>
          Driver
          <select
            className={appStyles.select}
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
                  className={appStyles.input}
                  value={draft.databasePath ?? ''}
                  onChange={(event) => setDraft({ ...draft, databasePath: event.target.value })}
                />
                <button
                  className={appStyles.button}
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
        <footer className={dialogStyles.dialogActions}>
          {workspace ? (
            <button
              className={appStyles.button}
              type="button"
              disabled={isLoading}
              onClick={onTestConnection}
            >
              Test Connection
            </button>
          ) : null}
          <button className={appStyles.button} type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={appStyles.button}
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
        className={appStyles.input}
        value={draft.host ?? ''}
        onChange={(event) => onDraftChange({ ...draft, host: event.target.value })}
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
        placeholder={
          workspace?.connection.driver !== 'sqlite' && workspace?.connection.hasPassword
            ? 'Saved password is kept when blank'
            : ''
        }
      />
    </label>
  </>
);
