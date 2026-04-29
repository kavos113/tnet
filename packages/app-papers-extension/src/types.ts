export interface BrowserDetectedPaperSource {
  sourceUrl: string;
  pageTitle?: string;
  canonicalUrl?: string;
  doi?: string;
  arxivId?: string;
  pdfUrl?: string;
  title?: string;
  authors?: string[];
  publishedYear?: number;
  venue?: string;
}

export interface BrowserPaperImportCandidate {
  source?: BrowserDetectedPaperSource;
  title?: string;
  authors?: string[];
  abstract?: string;
  publishedYear?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  pdfUrl?: string;
  tags?: string[];
}

export interface LibraryInfo {
  rootPath: string;
  name: string;
  isActive: boolean;
}

export interface DirectoryNode {
  name: string;
  relativePath: string;
  children?: DirectoryNode[];
}

export interface ImportBrowserPaperRequest {
  libraryRoot: string;
  directoryPath?: string;
  candidate: BrowserPaperImportCandidate;
  importPdf: boolean;
  tags?: string[];
}

export interface ImportBrowserPaperResponse {
  status: 'created' | 'duplicate' | 'metadata_only' | string;
  paper?: unknown;
}
