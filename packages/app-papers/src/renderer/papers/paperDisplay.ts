import type { PaperSummary } from '@tnet/app-papers/shared/paperTypes';

export const formatAuthors = (paper: Pick<PaperSummary, 'authors'>): string =>
  paper.authors.length > 0 ? paper.authors.join(', ') : 'No authors';

export const formatPaperYear = (paper: Pick<PaperSummary, 'publishedYear'>): string =>
  paper.publishedYear?.toString() ?? '-';

export const formatPaperJournal = (paper: Pick<PaperSummary, 'venue'>): string =>
  paper.venue ?? '-';

export const getPaperCountLabel = ({
  filteredCount,
  totalCount,
  hasFilter
}: {
  filteredCount: number;
  totalCount: number;
  hasFilter: boolean;
}): string =>
  hasFilter && filteredCount !== totalCount
    ? `${filteredCount} of ${totalCount} papers`
    : `${totalCount} papers`;
