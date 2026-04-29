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
let resizeObserverCallback:
  | ((entries: Array<{ contentRect: { width: number; height: number } }>) => void)
  | null = null;

class ResizeObserverMock {
  readonly callback: (entries: Array<{ contentRect: { width: number; height: number } }>) => void;

  constructor(
    callback: (entries: Array<{ contentRect: { width: number; height: number } }>) => void
  ) {
    this.callback = callback;
    resizeObserverCallback = callback;
  }

  observe(): void {
    this.callback([{ contentRect: { width: 832, height: 600 } }]);
  }

  disconnect(): void {
    resizeObserverCallback = null;
  }
}

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
        tags: {
          list: vi.fn(),
          upsert: vi.fn(),
          attach: vi.fn(),
          detach: vi.fn()
        },
        notes: {
          save: vi.fn()
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
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: ResizeObserverMock
    });
    resizeObserverCallback = null;
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

  it('loads PDF bytes through IPC and renders every page as a scrollable document', async () => {
    render(<PdfViewer libraryRoot="/papers/library" pdfPath="papers/lambda.pdf" />);

    await waitFor(() => {
      expect(loadBytes).toHaveBeenCalledWith({
        libraryRoot: '/papers/library',
        pdfPath: 'papers/lambda.pdf'
      });
      expect(getDocument).toHaveBeenCalledWith({ data: expect.any(Uint8Array) });
      expect(pdfDocument.getPage).toHaveBeenCalledWith(1);
      expect(pdfDocument.getPage).toHaveBeenCalledWith(2);
    });

    expect(screen.getByLabelText('PDF page count')).toHaveTextContent('2 pages');
    expect(screen.getByLabelText('PDF page 1 canvas')).toBeInTheDocument();
    expect(screen.getByLabelText('PDF page 2 canvas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('switches to two-page spread mode', async () => {
    render(<PdfViewer libraryRoot="/papers/library" pdfPath="papers/lambda.pdf" />);

    await screen.findByText('2 pages');

    fireEvent.click(screen.getByRole('button', { name: 'Two pages' }));

    const spreads = await screen.findAllByTestId('pdf-spread');
    expect(spreads).toHaveLength(1);
    expect(spreads[0]).toContainElement(screen.getByLabelText('PDF page 1 canvas'));
    expect(spreads[0]).toContainElement(screen.getByLabelText('PDF page 2 canvas'));
  });

  it('rerenders page-width PDFs when the viewer width changes', async () => {
    render(<PdfViewer libraryRoot="/papers/library" pdfPath="papers/lambda.pdf" />);

    const firstPageCanvas = await screen.findByLabelText('PDF page 1 canvas');

    await waitFor(() => {
      expect(firstPageCanvas).toHaveStyle({ width: '800px' });
    });

    resizeObserverCallback?.([{ contentRect: { width: 1032, height: 600 } }]);
    await waitFor(() => {
      expect(firstPageCanvas).toHaveStyle({ width: '1000px' });
    });
  });

  it('supports fixed zoom and opening the PDF externally', async () => {
    render(<PdfViewer libraryRoot="/papers/library" pdfPath="papers/lambda.pdf" />);

    await screen.findByText('2 pages');

    fireEvent.change(screen.getByRole('combobox', { name: 'PDF zoom' }), {
      target: { value: '150' }
    });
    await waitFor(() => {
      expect(screen.getByLabelText('PDF page 1 canvas')).toHaveStyle({ width: '150px' });
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
