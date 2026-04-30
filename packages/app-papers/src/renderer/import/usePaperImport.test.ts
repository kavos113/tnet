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
});
