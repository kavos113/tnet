import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PaperSummary } from '@tnet/app-papers/shared/paperTypes';
import { PaperListPane } from './PaperListPane';

const papers: PaperSummary[] = [
  {
    id: 'paper-1',
    title: 'Lambda Calculus Foundations',
    authors: [],
    publishedYear: 1936,
    venue: 'Annals of Mathematics',
    tags: [],
    hasPdf: true
  }
];

describe('PaperListPane', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a compact paper table and emits row/filter/import actions', () => {
    const onSelectPaper = vi.fn();
    const onTitleFilterChange = vi.fn();
    const onImportPdf = vi.fn();

    render(
      <PaperListPane
        items={papers}
        filteredItems={papers}
        selectedPaperId=""
        titleFilter=""
        paperCountLabel="1 papers"
        directoryLabel="All papers"
        isLoading={false}
        error=""
        widthPercent={40}
        onSelectPaper={onSelectPaper}
        onTitleFilterChange={onTitleFilterChange}
        onImportPdf={onImportPdf}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Year' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByText('Lambda Calculus Foundations')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter papers by title' }), {
      target: { value: 'lambda' }
    });
    fireEvent.click(screen.getByRole('row', { name: /Lambda Calculus Foundations/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Import PDF' }));

    expect(onTitleFilterChange).toHaveBeenCalledWith('lambda');
    expect(onSelectPaper).toHaveBeenCalledWith('paper-1');
    expect(onImportPdf).toHaveBeenCalled();
  });

  it('renders loading, error, and empty filter states', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <PaperListPane
        items={[]}
        filteredItems={[]}
        selectedPaperId=""
        titleFilter=""
        paperCountLabel="0 papers"
        directoryLabel="All papers"
        isLoading
        error="Failed"
        widthPercent={40}
        onSelectPaper={noop}
        onTitleFilterChange={noop}
        onImportPdf={noop}
      />
    );

    expect(screen.getByText('Loading papers...')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    rerender(
      <PaperListPane
        items={papers}
        filteredItems={[]}
        selectedPaperId=""
        titleFilter="missing"
        paperCountLabel="0 of 1 papers"
        directoryLabel="All papers"
        isLoading={false}
        error=""
        widthPercent={40}
        onSelectPaper={noop}
        onTitleFilterChange={noop}
        onImportPdf={noop}
      />
    );

    expect(screen.getByText('No papers match the current title filter.')).toBeInTheDocument();
  });
});
