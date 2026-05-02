import type { PdfViewerGlobalSettings } from './config';
import type { PdfWorkspacePathRequest } from './pdfViewerTypes';

export const pdfViewerIpcChannels = {
  config: {
    loadGlobal: 'pdfViewer:config:loadGlobal',
    saveGlobal: 'pdfViewer:config:saveGlobal'
  },
  pdf: {
    loadBytes: 'pdfViewer:pdf:loadBytes',
    openExternal: 'pdfViewer:pdf:openExternal'
  }
} as const;

export interface PdfViewerApi {
  pdfViewer: {
    config: {
      loadGlobal: () => Promise<PdfViewerGlobalSettings>;
      saveGlobal: (config: PdfViewerGlobalSettings) => Promise<void>;
    };
    pdf: {
      loadBytes: (request: PdfWorkspacePathRequest) => Promise<ArrayBuffer>;
      openExternal: (request: PdfWorkspacePathRequest) => Promise<void>;
    };
  };
}
