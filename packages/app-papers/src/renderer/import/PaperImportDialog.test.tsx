import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    const onCancel = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <PaperImportDialog
        candidate={candidate}
        bibtex="@article{paper,title={Lambda Calculus Foundations}}"
        metadata={{ title: 'Lambda Calculus Foundations' }}
        title="Lambda Calculus Foundations"
        onBibtexChange={vi.fn()}
        onMetadataChange={vi.fn()}
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
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables import while title is blank', () => {
    render(
      <PaperImportDialog
        candidate={candidate}
        bibtex=""
        metadata={{}}
        title=" "
        onBibtexChange={vi.fn()}
        onMetadataChange={vi.fn()}
        onTitleChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });
});
