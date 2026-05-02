import { describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { normalizeSearchText, searchPdfText } from './pdfTextSearch';

describe('PDF text search helpers', () => {
  it('normalizes whitespace and case for matching', () => {
    expect(normalizeSearchText('Hello\n  PDF')).toBe('hello pdf');
  });

  it('extracts page-level search results', async () => {
    const pdfDocument = {
      numPages: 2,
      getPage: vi.fn(async (pageNumber: number) => ({
        getTextContent: vi.fn(async () => ({
          items: [{ str: pageNumber === 1 ? 'Alpha beta' : 'Gamma beta' }]
        }))
      }))
    } as unknown as PDFDocumentProxy;

    await expect(searchPdfText(pdfDocument, 'BETA')).resolves.toEqual([
      {
        id: '1:6',
        pageNumber: 1,
        snippet: 'alpha beta',
        matchIndex: 6
      },
      {
        id: '2:6',
        pageNumber: 2,
        snippet: 'gamma beta',
        matchIndex: 6
      }
    ]);
  });
});
