import { describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { extractPdfOutline, resolveDestinationPageNumber } from './pdfOutline';

describe('PDF outline helpers', () => {
  it('resolves numeric, named, and ref destinations to page numbers', async () => {
    const pdfDocument = {
      getDestination: vi.fn(async () => [{ num: 10, gen: 0 }, { name: 'XYZ' }]),
      getPageIndex: vi.fn(async () => 4)
    } as unknown as PDFDocumentProxy;

    await expect(resolveDestinationPageNumber(pdfDocument, [1])).resolves.toBe(2);
    await expect(resolveDestinationPageNumber(pdfDocument, 'chapter')).resolves.toBe(5);
    await expect(resolveDestinationPageNumber(pdfDocument, null)).resolves.toBeUndefined();
  });

  it('normalizes outline trees into serializable items', async () => {
    const pdfDocument = {
      getOutline: vi.fn(async () => [
        {
          title: ' Chapter 1 ',
          dest: [0],
          items: [{ title: 'Child', dest: null }]
        }
      ])
    } as unknown as PDFDocumentProxy;

    await expect(extractPdfOutline(pdfDocument)).resolves.toEqual([
      {
        id: '0',
        title: 'Chapter 1',
        pageNumber: 1,
        url: undefined,
        children: [
          {
            id: '0.0',
            title: 'Child',
            pageNumber: undefined,
            url: undefined,
            children: []
          }
        ]
      }
    ]);
  });
});
