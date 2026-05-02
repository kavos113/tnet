import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfOutlineItem } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

interface RawOutlineItem {
  title?: string;
  dest?: unknown;
  url?: string;
  items?: RawOutlineItem[];
}

interface PdfRef {
  num: number;
  gen: number;
}

export const extractPdfOutline = async (
  pdfDocument: PDFDocumentProxy
): Promise<PdfOutlineItem[]> => {
  const outline = (await pdfDocument.getOutline()) as RawOutlineItem[] | null;
  if (!outline) return [];
  return Promise.all(
    outline.map((item, index) => normalizeOutlineItem(pdfDocument, item, `${index}`))
  );
};

const normalizeOutlineItem = async (
  pdfDocument: PDFDocumentProxy,
  item: RawOutlineItem,
  id: string
): Promise<PdfOutlineItem> => {
  const pageNumber = await resolveDestinationPageNumber(pdfDocument, item.dest);
  return {
    id,
    title: item.title?.trim() || 'Untitled',
    pageNumber,
    url: item.url,
    children: await Promise.all(
      (item.items ?? []).map((child, index) =>
        normalizeOutlineItem(pdfDocument, child, `${id}.${index}`)
      )
    )
  };
};

export const resolveDestinationPageNumber = async (
  pdfDocument: PDFDocumentProxy,
  destination: unknown
): Promise<number | undefined> => {
  if (!destination) return undefined;
  let resolvedDestination: unknown = destination;
  if (typeof destination === 'string') {
    resolvedDestination = await pdfDocument.getDestination(destination);
  }
  if (!Array.isArray(resolvedDestination)) return undefined;
  const first = resolvedDestination[0];
  if (typeof first === 'number') return first + 1;
  if (isPdfRef(first)) return (await pdfDocument.getPageIndex(first)) + 1;
  return undefined;
};

const isPdfRef = (value: unknown): value is PdfRef =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as PdfRef).num === 'number' &&
    typeof (value as PdfRef).gen === 'number'
  );
