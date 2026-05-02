import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfAnnotationItem } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

interface RawAnnotation {
  id?: string;
  subtype?: string;
  titleObj?: { str?: string };
  contentsObj?: { str?: string };
  modificationDate?: string;
  url?: string;
  dest?: string | unknown[];
}

export const extractPdfAnnotations = async (
  pdfDocument: PDFDocumentProxy
): Promise<PdfAnnotationItem[]> => {
  const annotations: PdfAnnotationItem[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const pageAnnotations = (await page.getAnnotations({ intent: 'display' })) as RawAnnotation[];
    annotations.push(
      ...pageAnnotations.map((annotation, index) => ({
        id: annotation.id ?? `${pageNumber}:${index}`,
        pageNumber,
        subtype: annotation.subtype ?? 'Annotation',
        title: annotation.titleObj?.str,
        contents: annotation.contentsObj?.str,
        modifiedAt: annotation.modificationDate,
        url: annotation.url,
        destination: typeof annotation.dest === 'string' ? annotation.dest : undefined
      }))
    );
  }
  return annotations;
};
