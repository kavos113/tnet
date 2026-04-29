export type PdfZoomMode = 'page-width' | 'page-fit' | 'actual-size' | '150' | '200';

export type PdfViewMode = 'single' | 'spread';

export interface PdfRenderScaleRequest {
  zoom: PdfZoomMode;
  pageWidth: number;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pagesInRow: number;
  gapPx: number;
}

export const pdfPagePaddingPx = 32;
export const pdfSpreadGapPx = 16;

export const fixedZoomScale = (zoom: PdfZoomMode): number | null => {
  if (zoom === 'actual-size') return 1;
  if (zoom === '150') return 1.5;
  if (zoom === '200') return 2;
  return null;
};

export const getPdfRenderScale = ({
  zoom,
  pageWidth,
  pageHeight,
  viewportWidth,
  viewportHeight,
  pagesInRow,
  gapPx
}: PdfRenderScaleRequest): number => {
  const fixedScale = fixedZoomScale(zoom);
  if (fixedScale !== null) return fixedScale;

  const rowGapWidth = Math.max(pagesInRow - 1, 0) * gapPx;
  const rowPageWidth = pageWidth * Math.max(pagesInRow, 1);
  const availableWidth = Math.max(viewportWidth - pdfPagePaddingPx - rowGapWidth, 1);
  const availableHeight = Math.max(viewportHeight - pdfPagePaddingPx, 1);
  const widthScale = availableWidth / rowPageWidth;

  if (zoom === 'page-width') return Math.max(widthScale, 0.1);

  const heightScale = availableHeight / pageHeight;
  return Math.max(Math.min(widthScale, heightScale), 0.1);
};

export const groupPdfPages = (pageCount: number, viewMode: PdfViewMode): number[][] => {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  if (viewMode === 'single') return pages.map((pageNumber) => [pageNumber]);

  const spreads: number[][] = [];
  for (let index = 0; index < pages.length; index += 2) {
    spreads.push(pages.slice(index, index + 2));
  }
  return spreads;
};
