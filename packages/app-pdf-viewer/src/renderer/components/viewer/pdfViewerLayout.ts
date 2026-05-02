import type { PdfDocumentViewState } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

export interface PdfRenderScaleRequest {
  viewState: PdfDocumentViewState;
  pageWidth: number;
  pageHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  gapPx: number;
  paddingPx: number;
}

export const pdfPageGapPx = 16;
export const pdfViewportPaddingPx = 32;
export const pdfMinPageWidthPx = 120;

export const getPdfRenderScale = ({
  viewState,
  pageWidth,
  pageHeight,
  viewportWidth,
  viewportHeight,
  gapPx,
  paddingPx
}: PdfRenderScaleRequest): number => {
  if (viewState.zoomMode === 'actual-size') return 1;
  if (viewState.zoomMode === 'custom') return viewState.customScale;

  const columns = Math.max(viewState.columns, 1);
  const totalGap = Math.max(columns - 1, 0) * gapPx;
  const availableWidth = Math.max(viewportWidth - paddingPx - totalGap, pdfMinPageWidthPx);
  const widthScale = Math.max(availableWidth / columns / pageWidth, 0.1);
  if (viewState.zoomMode === 'page-width') return widthScale;

  const availableHeight = Math.max(viewportHeight - paddingPx, 1);
  const heightScale = availableHeight / pageHeight;
  return Math.max(Math.min(widthScale, heightScale), 0.1);
};

export const groupPdfPages = (pageCount: number, columns: number): number[][] => {
  const normalizedColumns = Math.max(Math.round(columns), 1);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const rows: number[][] = [];
  for (let index = 0; index < pages.length; index += normalizedColumns) {
    rows.push(pages.slice(index, index + normalizedColumns));
  }
  return rows;
};
