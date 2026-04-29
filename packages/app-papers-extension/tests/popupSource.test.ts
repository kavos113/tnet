import { describe, expect, it } from 'vitest';
import { buildPopupSource } from '../src/popup/popupSource';

describe('buildPopupSource', () => {
  it('extracts a DOI from the active tab URL', () => {
    expect(
      buildPopupSource({
        url: 'https://dl.acm.org/doi/10.1145/3477132.3483540',
        title: 'ACM paper'
      })
    ).toMatchObject({
      sourceUrl: 'https://dl.acm.org/doi/10.1145/3477132.3483540',
      pageTitle: 'ACM paper',
      doi: '10.1145/3477132.3483540'
    });
  });

  it('prefers page metadata over URL fallback values', () => {
    expect(
      buildPopupSource(
        {
          url: 'https://dl.acm.org/doi/10.1145/3477132.3483540',
          title: 'Fallback title'
        },
        {
          sourceUrl: 'https://example.test/article',
          pageTitle: 'Page title',
          doi: '10.5555/page-meta',
          title: 'Metadata title'
        }
      )
    ).toMatchObject({
      sourceUrl: 'https://example.test/article',
      pageTitle: 'Page title',
      doi: '10.5555/page-meta',
      title: 'Metadata title'
    });
  });
});
