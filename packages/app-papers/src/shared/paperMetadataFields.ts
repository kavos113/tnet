import type { BibtexPaperMetadata } from './bibtex';

export type PaperMetadataTextField = Extract<
  keyof BibtexPaperMetadata,
  'title' | 'venue' | 'doi' | 'arxivId' | 'url' | 'abstract'
>;

export const PAPER_METADATA_FIELD_LABELS: Record<
  PaperMetadataTextField | 'authors' | 'publishedYear',
  string
> = {
  title: 'Title',
  authors: 'Authors',
  publishedYear: 'Year',
  venue: 'Venue',
  doi: 'DOI',
  arxivId: 'arXiv',
  url: 'URL',
  abstract: 'Abstract'
};
