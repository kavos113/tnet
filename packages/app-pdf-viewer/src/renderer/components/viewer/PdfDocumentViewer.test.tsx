import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPdfDocumentViewState } from '@tnet/app-pdf-viewer/shared/config';
import { PdfDocumentViewer } from './PdfDocumentViewer';

const getDocument = vi.fn();
const loadBytes = vi.fn();

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: (...args: unknown[]) => getDocument(...args)
}));

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'pdf.worker.mjs'
}));

vi.mock('./PdfPageCanvas', () => ({
  PdfPageCanvas: ({ pageNumber }: { pageNumber: number }) => <div>Page {pageNumber}</div>
}));

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      pdfViewer: {
        pdf: {
          loadBytes,
          openExternal: vi.fn()
        }
      }
    },
    writable: true
  });
};

describe('PdfDocumentViewer', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    installTnetApi();
    loadBytes.mockResolvedValue(new Uint8Array([37, 80, 68, 70]).buffer);
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        destroy: vi.fn(),
        getPage: vi.fn().mockResolvedValue({
          getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 })
        })
      }),
      destroy: vi.fn()
    });
  });

  it('passes CMap and standard font asset urls to pdf.js', async () => {
    render(
      <PdfDocumentViewer
        rootPath="/workspace"
        filePath="paper.pdf"
        viewState={defaultPdfDocumentViewState()}
        overscanPages={2}
        onPageCountChange={vi.fn()}
        onViewStateChange={vi.fn()}
      />
    );

    await waitFor(() => expect(getDocument).toHaveBeenCalled());

    expect(getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        cMapPacked: true,
        cMapUrl: expect.stringContaining('pdfjs/cmaps/'),
        disableFontFace: false,
        standardFontDataUrl: expect.stringContaining('pdfjs/standard_fonts/'),
        useSystemFonts: true,
        useWorkerFetch: false
      })
    );
  });
});
