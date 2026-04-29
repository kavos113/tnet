import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PaperDetail } from '@tnet/app-papers/shared/paperTypes';
import { PaperDetailPane } from './PaperDetailPane';

vi.mock('../papers/PdfViewer', () => ({
  PdfViewer: () => <div data-testid="pdf-viewer" />
}));

const detail: PaperDetail = {
  id: 'paper-1',
  title: 'Lambda Calculus Foundations',
  authors: ['Alonzo Church'],
  publishedYear: 1936,
  venue: 'Annals of Mathematics',
  tags: [],
  hasPdf: true,
  pdfPath: 'papers/lambda.pdf',
  directoryPath: 'logic',
  noteContent: '# Note'
};

describe('PaperDetailPane', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders no-selection and loading states', () => {
    const { rerender } = render(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId=""
        detail={null}
        activeDetailTab="pdf"
        isLoading={false}
        widthPercent={60}
        onSelectTab={vi.fn()}
      />
    );

    expect(screen.getByText('Select a paper.')).toBeInTheDocument();

    rerender(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={null}
        activeDetailTab="pdf"
        isLoading
        widthPercent={60}
        onSelectTab={vi.fn()}
      />
    );

    expect(screen.getByText('Loading paper detail...')).toBeInTheDocument();
  });

  it('renders detail tabs and delegates tab selection', () => {
    const onSelectTab = vi.fn();
    const { rerender } = render(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={detail}
        activeDetailTab="metadata"
        isLoading={false}
        widthPercent={60}
        onSelectTab={onSelectTab}
      />
    );

    expect(screen.getByText('Lambda Calculus Foundations')).toBeInTheDocument();
    expect(screen.getByText('Annals of Mathematics')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
    expect(onSelectTab).toHaveBeenCalledWith('pdf');

    rerender(
      <PaperDetailPane
        activeLibraryRoot="/papers/library"
        selectedPaperId="paper-1"
        detail={detail}
        activeDetailTab="pdf"
        isLoading={false}
        widthPercent={60}
        onSelectTab={onSelectTab}
      />
    );

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });
});
