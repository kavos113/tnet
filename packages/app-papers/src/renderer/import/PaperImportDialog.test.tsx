import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import { PaperImportDialog } from './PaperImportDialog';

const candidate: SelectedPdfImportCandidate = {
  sourcePath: 'C:/papers/lambda.pdf',
  sourceRelativePath: '',
  suggestedTitle: 'Lambda Calculus Foundations',
  targetDirectoryPath: 'logic',
  willCopy: true
};

describe('PaperImportDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders import metadata and emits title/cancel/confirm actions', () => {
    const onTitleChange = vi.fn();
    const onMetadataFieldChange = vi.fn();
    const onCancel = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <PaperImportDialog
        candidate={candidate}
        bibtex="@article{paper,title={Lambda Calculus Foundations}}"
        bibtexDiagnostics={[]}
        importError=""
        metadata={{ title: 'Lambda Calculus Foundations' }}
        title="Lambda Calculus Foundations"
        onBibtexChange={vi.fn()}
        onMetadataFieldChange={onMetadataFieldChange}
        onTitleChange={onTitleChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Copy to library')).toBeInTheDocument();
    expect(screen.getByText('logic/lambda.pdf')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Lambda Calculus Foundations'), {
      target: { value: 'New title' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel import' }));
    fireEvent.submit(screen.getByRole('form', { name: 'Import PDF metadata' }));

    expect(onTitleChange).toHaveBeenCalledWith('New title');
    fireEvent.change(screen.getByLabelText('Authors'), {
      target: { value: 'Alice, Bob' }
    });
    expect(onMetadataFieldChange).toHaveBeenCalledWith('authors', ['Alice', 'Bob']);
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables import while title is blank', () => {
    render(
      <PaperImportDialog
        candidate={candidate}
        bibtex=""
        bibtexDiagnostics={[]}
        importError=""
        metadata={{}}
        title=" "
        onBibtexChange={vi.fn()}
        onMetadataFieldChange={vi.fn()}
        onTitleChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('shows BibTeX diagnostics and can reload BibTeX from clipboard', async () => {
    const onBibtexChange = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: vi.fn().mockResolvedValue('@article{paper,title={Clipboard Paper}}')
      }
    });

    render(
      <PaperImportDialog
        candidate={candidate}
        bibtex="plain text"
        bibtexDiagnostics={[{ severity: 'error', message: 'BibTeX entry must start with @.' }]}
        importError=""
        metadata={{}}
        title="Fallback"
        onBibtexChange={onBibtexChange}
        onMetadataFieldChange={vi.fn()}
        onTitleChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('BibTeX entry must start with @.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Paste from clipboard' }));

    await waitFor(() => {
      expect(onBibtexChange).toHaveBeenCalledWith('@article{paper,title={Clipboard Paper}}');
    });
  });

  it('shows import validation errors', () => {
    render(
      <PaperImportDialog
        candidate={candidate}
        bibtex=""
        bibtexDiagnostics={[]}
        importError="Destination directory must stay inside the paper library."
        metadata={{}}
        title="Paper"
        onBibtexChange={vi.fn()}
        onMetadataFieldChange={vi.fn()}
        onTitleChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Destination directory must stay inside the paper library.'
    );
  });
});
