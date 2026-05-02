export type PdfZoomMode = 'page-width' | 'page-fit' | 'actual-size' | 'custom';

export interface PdfDocumentViewState {
  zoomMode: PdfZoomMode;
  customScale: number;
  columns: number;
  scrollTop: number;
}

export interface PdfViewerDocument {
  path: string;
  displayName: string;
  pageCount?: number;
  error?: string;
}

export interface PdfViewerOpenRequest {
  path: string;
  viewState?: Partial<PdfDocumentViewState>;
}

export interface PdfWorkspacePathRequest {
  rootDir: string;
  path: string;
}
