import { describe, expect, it } from 'vitest';
import { getPdfRenderScale, groupPdfPages, pdfSpreadGapPx } from './pdfViewerLayout';

describe('pdfViewerLayout', () => {
  it('groups pages as single pages or two-page spreads', () => {
    expect(groupPdfPages(3, 'single')).toEqual([[1], [2], [3]]);
    expect(groupPdfPages(3, 'spread')).toEqual([[1, 2], [3]]);
  });

  it('fits a single page to the available viewport width', () => {
    expect(
      getPdfRenderScale({
        zoom: 'page-width',
        pageWidth: 100,
        pageHeight: 200,
        viewportWidth: 832,
        viewportHeight: 600,
        pagesInRow: 1,
        gapPx: pdfSpreadGapPx
      })
    ).toBe(8);
  });

  it('fits two-page spreads to the available viewport width including the gap', () => {
    expect(
      getPdfRenderScale({
        zoom: 'page-width',
        pageWidth: 100,
        pageHeight: 200,
        viewportWidth: 248,
        viewportHeight: 600,
        pagesInRow: 2,
        gapPx: pdfSpreadGapPx
      })
    ).toBe(1);
  });

  it('keeps fixed zoom values independent from viewport size', () => {
    expect(
      getPdfRenderScale({
        zoom: '150',
        pageWidth: 100,
        pageHeight: 200,
        viewportWidth: 10,
        viewportHeight: 10,
        pagesInRow: 2,
        gapPx: pdfSpreadGapPx
      })
    ).toBe(1.5);
  });
});
