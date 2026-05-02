import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy
} from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { pdfViewerTnetApi } from '../pdfViewerTnetApi';
import { pdfJsAssetUrls } from '../components/viewer/pdfJsAssets';
import {
  PdfViewerCMapReaderFactory,
  PdfViewerStandardFontDataFactory
} from '../components/viewer/pdfJsFactories';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface LoadedPdfDocument {
  pdfDocument: PDFDocumentProxy;
  release: () => void;
}

interface CachedPdfDocument {
  promise: Promise<PDFDocumentProxy>;
  loadingTask: PDFDocumentLoadingTask;
  document?: PDFDocumentProxy;
  refCount: number;
}

const cache = new Map<string, CachedPdfDocument>();

export const pdfDocumentCacheKey = (rootPath: string, filePath: string): string =>
  `${rootPath}\n${filePath}`;

export const loadPdfDocument = async (
  rootPath: string,
  filePath: string
): Promise<LoadedPdfDocument> => {
  const key = pdfDocumentCacheKey(rootPath, filePath);
  let cached = cache.get(key);
  if (!cached) {
    const bytes = await pdfViewerTnetApi.pdfViewer.pdf.loadBytes({
      rootDir: rootPath,
      path: filePath
    });
    const loadingTask = getDocument({
      data: new Uint8Array(bytes),
      CMapReaderFactory: PdfViewerCMapReaderFactory,
      StandardFontDataFactory: PdfViewerStandardFontDataFactory,
      cMapPacked: true,
      disableFontFace: false,
      useSystemFonts: true,
      useWorkerFetch: false,
      ...pdfJsAssetUrls()
    });
    cached = {
      loadingTask,
      promise: loadingTask.promise.then((pdfDocument) => {
        const current = cache.get(key);
        if (current) current.document = pdfDocument;
        return pdfDocument;
      }),
      refCount: 0
    };
    cache.set(key, cached);
  }

  cached.refCount += 1;
  const pdfDocument = await cached.promise;
  return {
    pdfDocument,
    release: () => releasePdfDocument(key)
  };
};

export const releasePdfDocument = (key: string): void => {
  const cached = cache.get(key);
  if (!cached) return;
  cached.refCount -= 1;
  if (cached.refCount > 0) return;
  cache.delete(key);
  if (cached.document) void cached.document.destroy();
  else void cached.loadingTask.destroy();
};

export const clearPdfDocumentCache = (): void => {
  for (const cached of cache.values()) {
    if (cached.document) void cached.document.destroy();
    else void cached.loadingTask.destroy();
  }
  cache.clear();
};
