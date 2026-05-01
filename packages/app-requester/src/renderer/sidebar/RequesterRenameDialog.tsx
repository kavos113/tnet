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
  <div className="modal-overlay" onMouseDown={onCancel}>
    <section
      className="modal-content requester-rename-dialog"
      aria-label="Rename or move request"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <h2>Rename Request</h2>
      <label className="form-item" htmlFor="requester-rename-name">
        <span>Request name</span>
        <input
          id="requester-rename-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>
      <label className="form-item" htmlFor="requester-rename-folder">
        <span>Folder path</span>
        <input
          id="requester-rename-folder"
          placeholder="users/admin"
          value={folderPath}
          onChange={(event) => onFolderPathChange(event.target.value)}
        />
      </label>
      <div className="requester-path-preview" aria-label="Request path preview">
        <span>Request path</span>
        <strong>{pathPreview}</strong>
      </div>
      <footer className="modal-actions">
        <button type="button" className="settings-close-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="open-folder-button" onClick={onSave}>
          Save
        </button>
      </footer>
    </section>
  </div>
);
