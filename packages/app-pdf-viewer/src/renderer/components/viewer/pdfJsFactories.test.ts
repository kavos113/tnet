import { afterEach, describe, expect, it, vi } from 'vitest';
import { PdfViewerCMapReaderFactory, PdfViewerStandardFontDataFactory } from './pdfJsFactories';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('PDF.js asset factories', () => {
  it('loads compressed CMap bytes from the configured base URL', async () => {
    globalThis.fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))) as never;

    const factory = new PdfViewerCMapReaderFactory({
      baseUrl: 'https://assets.test/cmaps/',
      isCompressed: true
    });

    await expect(factory.fetch({ name: 'UniJIS-UCS2-H' })).resolves.toEqual({
      cMapData: new Uint8Array([1, 2, 3]),
      isCompressed: true
    });
    expect(globalThis.fetch).toHaveBeenCalledWith('https://assets.test/cmaps/UniJIS-UCS2-H.bcmap');
  });

  it('loads uncompressed CMap bytes and validates the name', async () => {
    globalThis.fetch = vi.fn(async () => new Response(new Uint8Array([4]))) as never;

    const factory = new PdfViewerCMapReaderFactory({
      baseUrl: 'https://assets.test/cmaps/',
      isCompressed: false
    });

    await expect(factory.fetch({ name: 'Identity-H' })).resolves.toEqual({
      cMapData: new Uint8Array([4]),
      isCompressed: false
    });
    await expect(factory.fetch({ name: '' })).rejects.toThrow('CMap name must be specified.');
  });

  it('loads standard font bytes and validates the filename', async () => {
    globalThis.fetch = vi.fn(async () => new Response(new Uint8Array([5, 6]))) as never;

    const factory = new PdfViewerStandardFontDataFactory({
      baseUrl: 'https://assets.test/fonts/'
    });

    await expect(factory.fetch({ filename: 'LiberationSans-Regular.ttf' })).resolves.toEqual(
      new Uint8Array([5, 6])
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://assets.test/fonts/LiberationSans-Regular.ttf'
    );
    await expect(factory.fetch({ filename: '' })).rejects.toThrow(
      'Font filename must be specified.'
    );
  });

  it('raises an error when asset fetch fails', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 404 })) as never;

    const factory = new PdfViewerStandardFontDataFactory({
      baseUrl: 'https://assets.test/fonts/'
    });

    await expect(factory.fetch({ filename: 'missing.ttf' })).rejects.toThrow(
      'Failed to load PDF.js asset: https://assets.test/fonts/missing.ttf'
    );
  });

  it('uses default asset URLs when base URLs are omitted', async () => {
    globalThis.fetch = vi.fn(async () => new Response(new Uint8Array([7]))) as never;

    await new PdfViewerCMapReaderFactory({}).fetch({ name: 'Identity-V' });
    await new PdfViewerStandardFontDataFactory({}).fetch({ filename: 'FoxitSerif.pfb' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pdfjs/cmaps/Identity-V.bcmap')
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/pdfjs/standard_fonts/FoxitSerif.pfb')
    );
  });
});
