import styles from './RequesterRenameDialog.module.css';
import controlStyles from '../RequesterControls.module.css';
import dialogStyles from '../RequesterDialog.module.css';

interface RequesterRenameDialogProps {
  name: string;
  folderPath: string;
  pathPreview: string;
  onNameChange: (value: string) => void;
  onFolderPathChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const RequesterRenameDialog = ({
  name,
  folderPath,
  pathPreview,
  onNameChange,
  onFolderPathChange,
  onCancel,
  onSave
}: RequesterRenameDialogProps): React.JSX.Element => (
  <div className={dialogStyles.overlay} role="presentation" onMouseDown={onCancel}>
    <section
      className={`${dialogStyles.modal} ${styles.dialog}`}
      aria-label="Rename or move request"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <h2>Rename Request</h2>
      <label className={dialogStyles.formItem} htmlFor="requester-rename-name">
        <span>Request name</span>
        <input
          id="requester-rename-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>
      <label className={dialogStyles.formItem} htmlFor="requester-rename-folder">
        <span>Folder path</span>
        <input
          id="requester-rename-folder"
          placeholder="users/admin"
          value={folderPath}
          onChange={(event) => onFolderPathChange(event.target.value)}
        />
      </label>
      <div className={styles.pathPreview} aria-label="Request path preview">
        <span>Request path</span>
        <strong>{pathPreview}</strong>
      </div>
      <footer className={dialogStyles.modalActions}>
        <button type="button" className={controlStyles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={controlStyles.openButton} onClick={onSave}>
          Save
        </button>
      </footer>
    </section>
  </div>
);
