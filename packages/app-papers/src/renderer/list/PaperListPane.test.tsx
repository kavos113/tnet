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
    tags: ['logic'],
    hasPdf: true
  }
];

describe('PaperListPane', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a compact paper table and emits row/filter/import actions', () => {
    const onSelectPaper = vi.fn();
    const onSearchQueryChange = vi.fn();
    const onToggleTag = vi.fn();
    const onImportPdf = vi.fn();

    render(
      <PaperListPane
        items={papers}
        tags={[{ id: 'tag-1', name: 'logic' }]}
        selectedPaperId=""
        searchQuery=""
        selectedTagIds={[]}
        paperCountLabel="1 papers"
        directoryLabel="All papers"
        isLoading={false}
        error=""
        widthPercent={40}
        onSelectPaper={onSelectPaper}
        onSearchQueryChange={onSearchQueryChange}
        onToggleTag={onToggleTag}
        onImportPdf={onImportPdf}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Year' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByText('Lambda Calculus Foundations')).toBeInTheDocument();
    expect(screen.getAllByText('logic')).toHaveLength(2);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search papers' }), {
      target: { value: 'lambda' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'logic' }));
    fireEvent.click(screen.getByRole('row', { name: /Lambda Calculus Foundations/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Import PDF' }));

    expect(onSearchQueryChange).toHaveBeenCalledWith('lambda');
    expect(onToggleTag).toHaveBeenCalledWith('tag-1');
    expect(onSelectPaper).toHaveBeenCalledWith('paper-1');
    expect(onImportPdf).toHaveBeenCalled();
  });

  it('renders loading, error, and empty filter states', () => {
    const noop = vi.fn();
    const { rerender } = render(
      <PaperListPane
        items={[]}
        tags={[]}
        selectedPaperId=""
        searchQuery=""
        selectedTagIds={[]}
        paperCountLabel="0 papers"
        directoryLabel="All papers"
        isLoading
        error="Failed"
        widthPercent={40}
        onSelectPaper={noop}
        onSearchQueryChange={noop}
        onToggleTag={noop}
        onImportPdf={noop}
      />
    );

    expect(screen.getByText('Loading papers...')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    rerender(
      <PaperListPane
        items={[]}
        tags={[]}
        selectedPaperId=""
        searchQuery="missing"
        selectedTagIds={[]}
        paperCountLabel="0 of 1 papers"
        directoryLabel="All papers"
        isLoading={false}
        error=""
        widthPercent={40}
        onSelectPaper={noop}
        onSearchQueryChange={noop}
        onToggleTag={noop}
        onImportPdf={noop}
      />
    );

    expect(screen.getByText('No papers match the current filters.')).toBeInTheDocument();
  });

  it('highlights search matches in visible result fields', () => {
    render(
      <PaperListPane
        items={papers}
        tags={[]}
        selectedPaperId=""
        searchQuery="lambda"
        selectedTagIds={[]}
        paperCountLabel="1 papers"
        directoryLabel="All papers"
        isLoading={false}
        error=""
        widthPercent={40}
        onSelectPaper={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onToggleTag={vi.fn()}
        onImportPdf={vi.fn()}
      />
    );

    expect(screen.getByText('Lambda')).toHaveClass('papers-list-highlight');
  });
});
