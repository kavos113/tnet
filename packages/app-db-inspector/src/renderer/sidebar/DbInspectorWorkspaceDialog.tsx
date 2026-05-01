import { useEffect, useState } from 'react';
import type { DbInspectorWorkspace } from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import styles from '../DbInspectorApp.module.css';

interface DbInspectorWorkspaceDialogProps {
  isOpen: boolean;
  workspace?: DbInspectorWorkspace;
  isLoading: boolean;
  onClose: () => void;
  onPickSqlite: () => Promise<{ path: string; name: string } | null>;
  onSave: (input: { name: string; databasePath: string; readOnly: boolean }) => void;
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
  const [name, setName] = useState('');
  const [databasePath, setDatabasePath] = useState('');
  const [readOnly, setReadOnly] = useState(true);

  useEffect(() => {
    setName(workspace?.name ?? '');
    setDatabasePath(workspace?.connection.databasePath ?? '');
    setReadOnly(workspace?.connection.readOnly ?? true);
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
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className={styles.label}>
          SQLite path
          <span className={styles.pathRow}>
            <input
              className={styles.input}
              value={databasePath}
              onChange={(event) => setDatabasePath(event.target.value)}
            />
            <button
              className={styles.button}
              type="button"
              onClick={() => {
                onPickSqlite().then((selected) => {
                  if (!selected) return;
                  setDatabasePath(selected.path);
                  setName((current) => current || selected.name);
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
            checked={readOnly}
            onChange={(event) => setReadOnly(event.target.checked)}
          />
          Open connection as read-only
        </label>
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
            onClick={() => onSave({ name, databasePath, readOnly })}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};
