import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import type { BibtexPaperMetadata } from '@tnet/app-papers/shared/bibtex';

export interface PaperImportDialogProps {
  candidate: SelectedPdfImportCandidate;
  bibtex: string;
  metadata: BibtexPaperMetadata;
  title: string;
  onBibtexChange: (bibtex: string) => void;
  onMetadataChange: (metadata: BibtexPaperMetadata) => void;
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
  bibtex,
  metadata,
  title,
  onBibtexChange,
  onMetadataChange,
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
        <span>BibTeX</span>
        <textarea
          value={bibtex}
          rows={7}
          placeholder="@article{...}"
          onChange={(event) => onBibtexChange(event.target.value)}
        />
      </label>
      <label className="papers-form-field">
        <span>Title</span>
        <input
          value={title}
          autoFocus
          required
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className="papers-form-field">
        <span>Authors</span>
        <input
          value={metadata.authors?.join(', ') ?? ''}
          onChange={(event) =>
            onMetadataChange({
              ...metadata,
              authors: event.target.value
                .split(',')
                .map((author) => author.trim())
                .filter(Boolean)
            })
          }
        />
      </label>
      <div className="papers-import-grid">
        <label className="papers-form-field">
          <span>Year</span>
          <input
            type="number"
            value={metadata.publishedYear ?? ''}
            onChange={(event) =>
              onMetadataChange({
                ...metadata,
                publishedYear: event.target.value ? Number(event.target.value) : undefined
              })
            }
          />
        </label>
        <label className="papers-form-field">
          <span>Venue</span>
          <input
            value={metadata.venue ?? ''}
            onChange={(event) => onMetadataChange({ ...metadata, venue: event.target.value })}
          />
        </label>
      </div>
      <div className="papers-import-grid">
        <label className="papers-form-field">
          <span>DOI</span>
          <input
            value={metadata.doi ?? ''}
            onChange={(event) => onMetadataChange({ ...metadata, doi: event.target.value })}
          />
        </label>
        <label className="papers-form-field">
          <span>arXiv</span>
          <input
            value={metadata.arxivId ?? ''}
            onChange={(event) => onMetadataChange({ ...metadata, arxivId: event.target.value })}
          />
        </label>
      </div>
      <label className="papers-form-field">
        <span>URL</span>
        <input
          value={metadata.url ?? ''}
          onChange={(event) => onMetadataChange({ ...metadata, url: event.target.value })}
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
