import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfSearchResult } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

export const searchPdfText = async (
  pdfDocument: PDFDocumentProxy,
  query: string
): Promise<PdfSearchResult[]> => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const results: PdfSearchResult[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = normalizeSearchText(
      textContent.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .join(' ')
    );
    let index = text.indexOf(normalizedQuery);
    while (index !== -1) {
      results.push({
        id: `${pageNumber}:${index}`,
        pageNumber,
        snippet: createSnippet(text, index, normalizedQuery.length),
        matchIndex: index
      });
      index = text.indexOf(normalizedQuery, index + normalizedQuery.length);
    }
  }
  return results;
};

export const normalizeSearchText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

const createSnippet = (text: string, index: number, length: number): string => {
  const start = Math.max(index - 40, 0);
  const end = Math.min(index + length + 40, text.length);
  return `${start > 0 ? '...' : ''}${text.slice(start, end)}${end < text.length ? '...' : ''}`;
};
