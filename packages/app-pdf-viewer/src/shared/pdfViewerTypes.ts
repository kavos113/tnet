export type PdfZoomMode = 'page-width' | 'page-fit' | 'actual-size' | 'custom';
export type PdfViewerSidebarPanel = 'files' | 'outline' | 'thumbnails' | 'annotations' | 'search';

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

export interface PdfPageNavigationRequest {
  requestId: number;
  path: string;
  pageNumber: number;
  source: PdfViewerSidebarPanel | 'external' | 'toolbar';
}

export interface PdfOutlineItem {
  id: string;
  title: string;
  pageNumber?: number;
  url?: string;
  children: PdfOutlineItem[];
}

export interface PdfAnnotationItem {
  id: string;
  pageNumber: number;
  subtype: string;
  title?: string;
  contents?: string;
  modifiedAt?: string;
  url?: string;
  destination?: string;
}

export interface PdfSearchResult {
  id: string;
  pageNumber: number;
  snippet: string;
  matchIndex: number;
}
