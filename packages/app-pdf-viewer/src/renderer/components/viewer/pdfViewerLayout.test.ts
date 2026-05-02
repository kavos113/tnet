import { describe, expect, it } from 'vitest';
import {
  getActivePdfPageFromScroll,
  getPdfRenderScale,
  getScrollTopForPdfPage,
  getVisiblePdfRowWindow,
  groupPdfPages
} from './pdfViewerLayout';

describe('PDF viewer layout', () => {
  it('groups pages by arbitrary column count', () => {
    expect(groupPdfPages(12, 4)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12]
    ]);
    expect(groupPdfPages(5, 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('calculates fit-width scale for multiple columns', () => {
    expect(
      getPdfRenderScale({
        viewState: {
          zoomMode: 'page-width',
          customScale: 1,
          columns: 4,
          scrollTop: 0
        },
        pageWidth: 100,
        pageHeight: 200,
        viewportWidth: 464,
        viewportHeight: 800,
        gapPx: 16,
        paddingPx: 16
      })
    ).toBe(1);
  });

  it('calculates the visible row window with overscan', () => {
    expect(
      getVisiblePdfRowWindow({
        rowCount: 20,
        scrollTop: 250,
        viewportHeight: 300,
        rowHeight: 100,
        rowGapPx: 20,
        paddingPx: 10,
        overscanRows: 1
      })
    ).toEqual({
      firstRowIndex: 1,
      lastRowIndex: 5
    });
  });

  it('maps page navigation to row scroll positions', () => {
    expect(
      getScrollTopForPdfPage({
        pageNumber: 5,
        columns: 2,
        rowHeight: 100,
        rowGapPx: 20,
        paddingPx: 16
      })
    ).toBe(256);
  });

  it('estimates the active page from scroll position', () => {
    expect(
      getActivePdfPageFromScroll({
        pageCount: 8,
        columns: 2,
        scrollTop: 256,
        rowHeight: 100,
        rowGapPx: 20,
        paddingPx: 16
      })
    ).toBe(5);
  });
});
