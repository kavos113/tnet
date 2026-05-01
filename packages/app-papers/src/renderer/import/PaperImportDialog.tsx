import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import type { BibtexPaperMetadata, BibtexParseDiagnostic } from '@tnet/app-papers/shared/bibtex';
import { PAPER_METADATA_FIELD_LABELS } from '@tnet/app-papers/shared/paperMetadataFields';
import buttonStyles from '../PapersButtons.module.css';
import type { PaperImportMetadataField } from './usePaperImport';
import styles from './PaperImportDialog.module.css';

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
  <div className={styles.backdrop} role="presentation">
    <form
      className={styles.dialog}
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
        <button
          type="button"
          className={buttonStyles.iconButton}
          aria-label="Cancel import"
          onClick={onCancel}
        >
          <span className="material-icons-round" aria-hidden="true">
            close
          </span>
        </button>
      </header>
      <label className={styles.formField}>
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
        className={buttonStyles.secondaryButton}
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
        <div className={styles.diagnostics} role="status">
          {bibtexDiagnostics.map((diagnostic) => (
            <p
              key={`${diagnostic.severity}:${diagnostic.message}`}
              className={diagnostic.severity === 'error' ? styles.error : styles.warning}
            >
              {diagnostic.message}
            </p>
          ))}
        </div>
      ) : null}
      {importError ? (
        <div className={styles.diagnostics} role="alert">
          <p className={styles.error}>{importError}</p>
        </div>
      ) : null}
      <label className={styles.formField}>
        <span>{PAPER_METADATA_FIELD_LABELS.title}</span>
        <input
          value={title}
          autoFocus
          required
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className={styles.formField}>
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
      <div className={styles.grid}>
        <label className={styles.formField}>
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
        <label className={styles.formField}>
          <span>{PAPER_METADATA_FIELD_LABELS.venue}</span>
          <input
            value={metadata.venue ?? ''}
            onChange={(event) => onMetadataFieldChange('venue', event.target.value)}
          />
        </label>
      </div>
      <div className={styles.grid}>
        <label className={styles.formField}>
          <span>{PAPER_METADATA_FIELD_LABELS.doi}</span>
          <input
            value={metadata.doi ?? ''}
            onChange={(event) => onMetadataFieldChange('doi', event.target.value)}
          />
        </label>
        <label className={styles.formField}>
          <span>{PAPER_METADATA_FIELD_LABELS.arxivId}</span>
          <input
            value={metadata.arxivId ?? ''}
            onChange={(event) => onMetadataFieldChange('arxivId', event.target.value)}
          />
        </label>
      </div>
      <label className={styles.formField}>
        <span>{PAPER_METADATA_FIELD_LABELS.url}</span>
        <input
          value={metadata.url ?? ''}
          onChange={(event) => onMetadataFieldChange('url', event.target.value)}
        />
      </label>
      <div className={styles.paths}>
        <span>{candidate.willCopy ? 'Copy to library' : 'Register existing file'}</span>
        <code>{importTargetLabel(candidate)}</code>
      </div>
      <footer>
        <button type="button" className={buttonStyles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={buttonStyles.primaryButton} disabled={!title.trim()}>
          Import
        </button>
      </footer>
    </form>
  </div>
);
