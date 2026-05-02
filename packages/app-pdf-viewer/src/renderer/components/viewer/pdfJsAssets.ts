export interface PdfJsAssetUrls {
  cMapUrl: string;
  standardFontDataUrl: string;
}

const baseUrl = import.meta.env.BASE_URL || './';

export const pdfJsAssetUrls = (): PdfJsAssetUrls => ({
  cMapUrl: new URL('pdfjs/cmaps/', new URL(baseUrl, window.location.href)).toString(),
  standardFontDataUrl: new URL(
    'pdfjs/standard_fonts/',
    new URL(baseUrl, window.location.href)
  ).toString()
});
