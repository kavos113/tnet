import type { PapersGlobalConfig, PapersLibraryConfig } from './config';
import type { PaperDetail, PaperSummary } from './paperTypes';

export interface SelectedPdfImportCandidate {
  sourcePath: string;
  suggestedTitle: string;
  sourceRelativePath?: string;
  willCopy: boolean;
  targetDirectoryPath: string;
}

export interface CreatePaperFromPdfRequest {
  libraryRoot: string;
  sourcePath: string;
  title: string;
  authors?: string[];
  abstract?: string;
  publishedYear?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
  directoryPath?: string;
}

export const papersIpcChannels = {
  config: {
    loadGlobal: 'papers:config:loadGlobal',
    saveGlobal: 'papers:config:saveGlobal',
    loadLibrary: 'papers:config:loadLibrary',
    saveLibrary: 'papers:config:saveLibrary'
  },
  library: {
    selectPdf: 'papers:library:selectPdf',
    createPaperFromPdf: 'papers:library:createPaperFromPdf',
    importPdf: 'papers:library:importPdf'
  },
  papers: {
    list: 'papers:papers:list',
    get: 'papers:papers:get'
  },
  pdf: {
    loadBytes: 'papers:pdf:loadBytes',
    openExternal: 'papers:pdf:openExternal'
  }
} as const;

export interface PapersApi {
  papers: {
    config: {
      loadGlobal: () => Promise<PapersGlobalConfig>;
      saveGlobal: (config: PapersGlobalConfig) => Promise<void>;
      loadLibrary: (libraryRoot: string) => Promise<PapersLibraryConfig>;
      saveLibrary: (libraryRoot: string, config: PapersLibraryConfig) => Promise<void>;
    };
    library: {
      selectPdf: (request: {
        libraryRoot: string;
        directoryPath?: string;
      }) => Promise<SelectedPdfImportCandidate | null>;
      createPaperFromPdf: (request: CreatePaperFromPdfRequest) => Promise<PaperDetail>;
      importPdf: (request: {
        libraryRoot: string;
        directoryPath?: string;
      }) => Promise<PaperDetail | null>;
    };
    papers: {
      list: (request: { libraryRoot: string; directoryPath?: string }) => Promise<PaperSummary[]>;
      get: (request: { libraryRoot: string; paperId: string }) => Promise<PaperDetail | null>;
    };
    pdf: {
      loadBytes: (request: { libraryRoot: string; pdfPath: string }) => Promise<ArrayBuffer>;
      openExternal: (request: { libraryRoot: string; pdfPath: string }) => Promise<void>;
    };
  };
}
