import { pdfJsAssetUrls } from './pdfJsAssets';

const fetchBytes = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load PDF.js asset: ${url}`);
  return new Uint8Array(await response.arrayBuffer());
};

export class PdfViewerCMapReaderFactory {
  private readonly baseUrl: string;
  private readonly isCompressed: boolean;

  constructor({ baseUrl, isCompressed = true }: { baseUrl?: string; isCompressed?: boolean }) {
    this.baseUrl = baseUrl ?? pdfJsAssetUrls().cMapUrl;
    this.isCompressed = isCompressed;
  }

  async fetch({
    name
  }: {
    name: string;
  }): Promise<{ cMapData: Uint8Array; isCompressed: boolean }> {
    if (!name) throw new Error('CMap name must be specified.');
    const suffix = this.isCompressed ? '.bcmap' : '';
    return {
      cMapData: await fetchBytes(`${this.baseUrl}${name}${suffix}`),
      isCompressed: this.isCompressed
    };
  }
}

export class PdfViewerStandardFontDataFactory {
  private readonly baseUrl: string;

  constructor({ baseUrl }: { baseUrl?: string }) {
    this.baseUrl = baseUrl ?? pdfJsAssetUrls().standardFontDataUrl;
  }

  async fetch({ filename }: { filename: string }): Promise<Uint8Array> {
    if (!filename) throw new Error('Font filename must be specified.');
    return fetchBytes(`${this.baseUrl}${filename}`);
  }
}
