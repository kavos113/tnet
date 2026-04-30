import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import type { BibtexPaperMetadata, BibtexParseDiagnostic } from '@tnet/app-papers/shared/bibtex';
import { PAPER_METADATA_FIELD_LABELS } from '@tnet/app-papers/shared/paperMetadataFields';
import type { PaperImportMetadataField } from './usePaperImport';

export interface PaperImportDialogProps {
  candidate: SelectedPdfImportCandidate;
  bibtex: string;
  bibtexDiagnostics: BibtexParseDiagnostic[];
  importError: string;
  metadata: BibtexPaperMetadata;
  title: string;
  onBibtexChange: (bibtex: string) => void;
  onMetadataFieldChange: <Field extends PaperImportMetadataField>(
    field: Field,
    value: BibtexPaperMetadata[Field]
  ) => void;
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
  bibtexDiagnostics,
  importError,
  metadata,
  title,
  onBibtexChange,
  onMetadataFieldChange,
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
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          navigator.clipboard
            .readText()
            .then(onBibtexChange)
            .catch((error: unknown) => {
              console.error('Failed to read clipboard BibTeX', error);
            });
        }}
      >
        Paste from clipboard
      </button>
      {bibtexDiagnostics.length > 0 ? (
        <div className="papers-import-diagnostics" role="status">
          {bibtexDiagnostics.map((diagnostic) => (
            <p key={`${diagnostic.severity}:${diagnostic.message}`} className={diagnostic.severity}>
              {diagnostic.message}
            </p>
          ))}
        </div>
      ) : null}
      {importError ? (
        <div className="papers-import-diagnostics" role="alert">
          <p className="error">{importError}</p>
        </div>
      ) : null}
      <label className="papers-form-field">
        <span>{PAPER_METADATA_FIELD_LABELS.title}</span>
        <input
          value={title}
          autoFocus
          required
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className="papers-form-field">
        <span>{PAPER_METADATA_FIELD_LABELS.authors}</span>
        <input
          value={metadata.authors?.join(', ') ?? ''}
          onChange={(event) =>
            onMetadataFieldChange(
              'authors',
              event.target.value
                .split(',')
                .map((author) => author.trim())
                .filter(Boolean)
            )
          }
        />
      </label>
      <div className="papers-import-grid">
        <label className="papers-form-field">
          <span>{PAPER_METADATA_FIELD_LABELS.publishedYear}</span>
          <input
            type="number"
            value={metadata.publishedYear ?? ''}
            onChange={(event) =>
              onMetadataFieldChange(
                'publishedYear',
                event.target.value ? Number(event.target.value) : undefined
              )
            }
          />
        </label>
        <label className="papers-form-field">
          <span>{PAPER_METADATA_FIELD_LABELS.venue}</span>
          <input
            value={metadata.venue ?? ''}
            onChange={(event) => onMetadataFieldChange('venue', event.target.value)}
          />
        </label>
      </div>
      <div className="papers-import-grid">
        <label className="papers-form-field">
          <span>{PAPER_METADATA_FIELD_LABELS.doi}</span>
          <input
            value={metadata.doi ?? ''}
            onChange={(event) => onMetadataFieldChange('doi', event.target.value)}
          />
        </label>
        <label className="papers-form-field">
          <span>{PAPER_METADATA_FIELD_LABELS.arxivId}</span>
          <input
            value={metadata.arxivId ?? ''}
            onChange={(event) => onMetadataFieldChange('arxivId', event.target.value)}
          />
        </label>
      </div>
      <label className="papers-form-field">
        <span>{PAPER_METADATA_FIELD_LABELS.url}</span>
        <input
          value={metadata.url ?? ''}
          onChange={(event) => onMetadataFieldChange('url', event.target.value)}
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
