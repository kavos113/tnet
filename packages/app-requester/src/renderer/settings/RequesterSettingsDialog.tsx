interface RequesterSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequesterSettingsDialog = ({
  isOpen,
  onClose
}: RequesterSettingsDialogProps): React.JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div className="settings-dialog-backdrop" role="presentation">
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Requester settings"
      >
        <header className="settings-dialog-header">
          <h2>Requester Settings</h2>
          <button type="button" className="settings-close-button" onClick={onClose}>
            Close
          </button>
        </header>
        <p>
          Requester workspace settings will be available after workspace storage is implemented.
        </p>
      </section>
    </div>
  );
};
