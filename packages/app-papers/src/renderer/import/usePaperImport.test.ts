import { describe, expect, it } from 'vitest';
import { mergeBibtexMetadata } from './usePaperImport';

describe('mergeBibtexMetadata', () => {
  it('keeps dirty fields when BibTeX is reloaded', () => {
    expect(
      mergeBibtexMetadata({
        currentTitle: 'Manual title',
        currentMetadata: {
          authors: ['Manual Author'],
          venue: 'Manual Venue',
          doi: '10.1000/old'
        },
        dirtyFields: {
          title: true,
          authors: true,
          venue: true
        },
        parsedMetadata: {
          title: 'BibTeX title',
          authors: ['BibTeX Author'],
          venue: 'BibTeX Venue',
          doi: '10.1000/new',
          publishedYear: 2026
        }
      })
    ).toEqual({
      title: 'Manual title',
      metadata: {
        authors: ['Manual Author'],
        venue: 'Manual Venue',
        doi: '10.1000/new',
        publishedYear: 2026
      }
    });
  });

  it('replaces clean fields and removes empty parsed values', () => {
    expect(
      mergeBibtexMetadata({
        currentTitle: 'Current title',
        currentMetadata: {
          authors: ['Old Author'],
          abstract: 'Old abstract',
          venue: 'Old Venue',
          doi: '10.1000/old',
          arxivId: 'old',
          url: 'https://old.test'
        },
        dirtyFields: {},
        parsedMetadata: {
          title: 'Parsed title',
          authors: [],
          abstract: '',
          publishedYear: undefined,
          venue: 'Parsed Venue',
          doi: undefined,
          arxivId: '',
          url: 'https://example.test'
        }
      })
    ).toEqual({
      title: 'Parsed title',
      metadata: {
        venue: 'Parsed Venue',
        url: 'https://example.test'
      }
    });
  });

  it('keeps current title when parsed metadata has no title', () => {
    expect(
      mergeBibtexMetadata({
        currentTitle: 'Current title',
        currentMetadata: {},
        dirtyFields: {},
        parsedMetadata: {
          authors: ['Author']
        }
      })
    ).toEqual({
      title: 'Current title',
      metadata: {
        authors: ['Author']
      }
    });
  });
});
