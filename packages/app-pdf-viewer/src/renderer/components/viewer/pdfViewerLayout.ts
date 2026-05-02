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

export interface PdfVisibleRowWindowRequest {
  rowCount: number;
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  rowGapPx: number;
  paddingPx: number;
  overscanRows: number;
}

export interface PdfVisibleRowWindow {
  firstRowIndex: number;
  lastRowIndex: number;
}

export interface PdfPageScrollRequest {
  pageNumber: number;
  columns: number;
  rowHeight: number;
  rowGapPx: number;
  paddingPx: number;
}

export interface PdfActivePageRequest {
  pageCount: number;
  columns: number;
  scrollTop: number;
  rowHeight: number;
  rowGapPx: number;
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

export const getVisiblePdfRowWindow = ({
  rowCount,
  scrollTop,
  viewportHeight,
  rowHeight,
  rowGapPx,
  paddingPx,
  overscanRows
}: PdfVisibleRowWindowRequest): PdfVisibleRowWindow => {
  if (rowCount <= 0) return { firstRowIndex: 0, lastRowIndex: -1 };
  if (rowHeight <= 0) return { firstRowIndex: 0, lastRowIndex: rowCount - 1 };

  const rowStride = rowHeight + rowGapPx;
  const viewportStart = Math.max(scrollTop - paddingPx, 0);
  const viewportEnd = Math.max(scrollTop + viewportHeight - paddingPx, viewportStart);
  const firstVisibleRow = Math.floor(viewportStart / rowStride);
  const lastVisibleRow = Math.max(Math.ceil(viewportEnd / rowStride) - 1, firstVisibleRow);

  return {
    firstRowIndex: Math.max(firstVisibleRow - overscanRows, 0),
    lastRowIndex: Math.min(lastVisibleRow + overscanRows, rowCount - 1)
  };
};

export const getScrollTopForPdfPage = ({
  pageNumber,
  columns,
  rowHeight,
  rowGapPx,
  paddingPx
}: PdfPageScrollRequest): number => {
  const normalizedColumns = Math.max(Math.round(columns), 1);
  const normalizedPage = Math.max(Math.round(pageNumber), 1);
  const rowIndex = Math.floor((normalizedPage - 1) / normalizedColumns);
  return paddingPx + rowIndex * (rowHeight + rowGapPx);
};

export const getActivePdfPageFromScroll = ({
  pageCount,
  columns,
  scrollTop,
  rowHeight,
  rowGapPx,
  paddingPx
}: PdfActivePageRequest): number => {
  if (pageCount <= 0 || rowHeight <= 0) return 1;
  const normalizedColumns = Math.max(Math.round(columns), 1);
  const rowStride = rowHeight + rowGapPx;
  const rowIndex = Math.max(Math.floor(Math.max(scrollTop - paddingPx, 0) / rowStride), 0);
  return Math.min(rowIndex * normalizedColumns + 1, pageCount);
};
