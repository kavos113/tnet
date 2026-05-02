import { describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { extractPdfAnnotations } from './pdfAnnotations';

describe('PDF annotation helpers', () => {
  it('normalizes display annotations by page', async () => {
    const pdfDocument = {
      numPages: 1,
      getPage: vi.fn(async () => ({
        getAnnotations: vi.fn(async () => [
          {
            id: 'a1',
            subtype: 'Link',
            titleObj: { str: 'Title' },
            contentsObj: { str: 'Contents' },
            modificationDate: 'D:20260101000000',
            url: 'https://example.com'
          }
        ])
      }))
    } as unknown as PDFDocumentProxy;

    await expect(extractPdfAnnotations(pdfDocument)).resolves.toEqual([
      {
        id: 'a1',
        pageNumber: 1,
        subtype: 'Link',
        title: 'Title',
        contents: 'Contents',
        modifiedAt: 'D:20260101000000',
        url: 'https://example.com',
        destination: undefined
      }
    ]);
  });
});
