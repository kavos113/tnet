import { useProjectSettingsDraft } from './useProjectSettingsDraft';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose
}: SettingsDialogProps): React.JSX.Element | null => {
  const { draft, updateDraft, saveSettings } = useProjectSettingsDraft(isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className="modal-content"
        aria-label="Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Settings</h2>

        <div className="settings-group">
          <h3>Editor Font</h3>
          <label className="form-item" htmlFor="editor-font-family">
            <span>Font family</span>
            <input
              id="editor-font-family"
              value={draft.editorFontFamily}
              onChange={(event) => updateDraft('editorFontFamily', event.target.value)}
            />
          </label>
          <label className="form-item" htmlFor="editor-font-size">
            <span>Font size (px)</span>
            <input
              id="editor-font-size"
              type="number"
              min={8}
              max={48}
              value={draft.editorFontSize}
              onChange={(event) => updateDraft('editorFontSize', Number(event.target.value))}
            />
          </label>
        </div>

        <div className="settings-group">
          <h3>Preview Font</h3>
          <label className="form-item" htmlFor="preview-font-family">
            <span>Font family</span>
            <input
              id="preview-font-family"
              value={draft.previewFontFamily}
              onChange={(event) => updateDraft('previewFontFamily', event.target.value)}
            />
          </label>
          <label className="form-item" htmlFor="preview-font-size">
            <span>Font size (px)</span>
            <input
              id="preview-font-size"
              type="number"
              min={8}
              max={48}
              value={draft.previewFontSize}
              onChange={(event) => updateDraft('previewFontSize', Number(event.target.value))}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              saveSettings()
                .then(onClose)
                .catch((error: unknown) => {
                  console.error('Failed to save settings', error);
                });
            }}
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
};
