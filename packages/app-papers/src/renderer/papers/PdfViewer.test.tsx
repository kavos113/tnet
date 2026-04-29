import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfViewer } from './PdfViewer';

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'pdf-worker-url'
}));

const getDocument = vi.hoisted(() => vi.fn());
const pdfDocument = vi.hoisted(() => ({
  numPages: 2,
  destroy: vi.fn().mockResolvedValue(undefined),
  getPage: vi.fn()
}));
const renderPage = vi.hoisted(() => vi.fn());

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument
}));

const loadBytes = vi.fn();
const openExternal = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: vi.fn(),
        openWithDefaultApp: vi.fn(),
        createDirectory: vi.fn()
      },
      session: {
        load: vi.fn(),
        save: vi.fn()
      },
      config: {
        loadGlobal: vi.fn(),
        saveGlobal: vi.fn()
      },
      papers: {
        config: {
          loadGlobal: vi.fn(),
          saveGlobal: vi.fn(),
          loadLibrary: vi.fn(),
          saveLibrary: vi.fn()
        },
        library: {
          selectPdf: vi.fn(),
          createPaperFromPdf: vi.fn(),
          importPdf: vi.fn()
        },
        papers: {
          list: vi.fn(),
          get: vi.fn()
        },
        pdf: {
          loadBytes,
          openExternal
        }
      }
    },
    writable: true
  });
};

describe('PdfViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installTnetApi();
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => ({}))
    });
    loadBytes.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    openExternal.mockResolvedValue(undefined);
    renderPage.mockReturnValue({
      cancel: vi.fn(),
      promise: Promise.resolve()
    });
    pdfDocument.getPage.mockResolvedValue({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 100 * scale,
        height: 200 * scale
      }),
      render: renderPage
    });
    getDocument.mockReturnValue({
      destroy: vi.fn().mockResolvedValue(undefined),
      promise: Promise.resolve(pdfDocument)
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('loads PDF bytes through IPC and renders the first page with pdf.js', async () => {
    render(<PdfViewer libraryRoot="/papers/library" pdfPath="papers/lambda.pdf" />);

    await waitFor(() => {
      expect(loadBytes).toHaveBeenCalledWith({
        libraryRoot: '/papers/library',
        pdfPath: 'papers/lambda.pdf'
      });
      expect(getDocument).toHaveBeenCalledWith({ data: expect.any(Uint8Array) });
      expect(pdfDocument.getPage).toHaveBeenCalledWith(1);
    });

    expect(screen.getByLabelText('PDF page')).toHaveTextContent('1 / 2');
    expect(screen.getByLabelText('PDF page canvas')).toBeInTheDocument();
  });

  it('supports page navigation, zoom, and opening the PDF externally', async () => {
    render(<PdfViewer libraryRoot="/papers/library" pdfPath="papers/lambda.pdf" />);

    await screen.findByText('1 / 2');

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      expect(pdfDocument.getPage).toHaveBeenCalledWith(2);
    });
    expect(screen.getByLabelText('PDF page')).toHaveTextContent('2 / 2');

    fireEvent.change(screen.getByRole('combobox', { name: 'PDF zoom' }), {
      target: { value: '150' }
    });
    await waitFor(() => {
      expect(renderPage).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open PDF' }));
    expect(openExternal).toHaveBeenCalledWith({
      libraryRoot: '/papers/library',
      pdfPath: 'papers/lambda.pdf'
    });
  });

  it('shows an empty state when no PDF path is registered', () => {
    render(<PdfViewer libraryRoot="/papers/library" />);

    expect(screen.getByText('No PDF registered.')).toBeInTheDocument();
    expect(loadBytes).not.toHaveBeenCalled();
  });
});
