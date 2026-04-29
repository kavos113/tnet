import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';

export interface PaperImportDialogProps {
  candidate: SelectedPdfImportCandidate;
  title: string;
  onTitleChange: (title: string) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const importTargetLabel = (candidate: SelectedPdfImportCandidate): string => {
  if (candidate.sourceRelativePath) return candidate.sourceRelativePath;
  const fileName = candidate.sourcePath.split(/[\\/]/).pop() ?? 'paper.pdf';
  const directoryPath = candidate.targetDirectoryPath || 'papers';
  return `${directoryPath}/${fileName}`;
};

export const PaperImportDialog = ({
  candidate,
  title,
  onTitleChange,
  onCancel,
  onConfirm
}: PaperImportDialogProps): React.JSX.Element => (
  <div className="papers-import-backdrop" role="presentation">
    <form
      className="papers-import-dialog"
      aria-label="Import PDF metadata"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm().catch((importError: unknown) => {
          console.error('Failed to import PDF', importError);
        });
      }}
    >
      <header>
        <h2>Import PDF</h2>
        <button type="button" className="icon-button" aria-label="Cancel import" onClick={onCancel}>
          <span className="material-icons-round" aria-hidden="true">
            close
          </span>
        </button>
      </header>
      <label className="papers-form-field">
        <span>Title</span>
        <input
          value={title}
          autoFocus
          required
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <div className="papers-import-paths">
        <span>{candidate.willCopy ? 'Copy to library' : 'Register existing file'}</span>
        <code>{importTargetLabel(candidate)}</code>
      </div>
      <footer>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={!title.trim()}>
          Import
        </button>
      </footer>
    </form>
  </div>
);
