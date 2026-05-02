import { describe, expect, it } from 'vitest';
import { createPdfLinkHref, parsePdfLinkTarget, workspaceNameForRoot } from './pdfLink';

describe('PDF link helpers', () => {
  it('parses workspace-name based PDF links', () => {
    expect(parsePdfLinkTarget('pdf:slides/0407.pdf')).toEqual({
      ok: true,
      target: {
        workspaceName: 'slides',
        relativePath: '0407.pdf'
      }
    });
  });

  it('decodes percent-encoded workspace and file names', () => {
    expect(parsePdfLinkTarget('pdf:lecture%20slides/04%2007.pdf')).toEqual({
      ok: true,
      target: {
        workspaceName: 'lecture slides',
        relativePath: '04 07.pdf'
      }
    });
  });

  it('rejects invalid PDF link targets', () => {
    expect(parsePdfLinkTarget('https://example.com')).toEqual({
      ok: false,
      error: 'PDF link must start with pdf:.'
    });
    expect(parsePdfLinkTarget('pdf:slides/notes.txt')).toEqual({
      ok: false,
      error: 'PDF link target must be a .pdf file.'
    });
  });

  it('creates encoded PDF link hrefs', () => {
    expect(createPdfLinkHref('lecture slides', '04 07/資料.pdf')).toBe(
      'pdf:lecture%20slides/04%2007/%E8%B3%87%E6%96%99.pdf'
    );
  });

  it('uses the workspace root basename as the workspace name', () => {
    expect(workspaceNameForRoot('C:/Users/me/slides')).toBe('slides');
  });
});
