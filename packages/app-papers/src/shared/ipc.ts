import type { PapersGlobalConfig, PapersLibraryConfig } from './config';
import type { PaperDetail, PaperSummary, PaperTag } from './paperTypes';

export interface SelectedPdfImportCandidate {
  sourcePath: string;
  suggestedTitle: string;
  clipboardBibtex?: string;
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

export interface CreatePaperFromPdfBytesRequest {
  libraryRoot: string;
  fileName: string;
  pdfBytes: Uint8Array<ArrayBuffer>;
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

export interface ListPapersRequest {
  libraryRoot: string;
  directoryPath?: string;
  query?: string;
  tagIds?: string[];
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
    createPaperFromPdfBytes: 'papers:library:createPaperFromPdfBytes',
    importPdf: 'papers:library:importPdf'
  },
  papers: {
    list: 'papers:papers:list',
    get: 'papers:papers:get'
  },
  tags: {
    list: 'papers:tags:list',
    upsert: 'papers:tags:upsert',
    attach: 'papers:tags:attach',
    detach: 'papers:tags:detach'
  },
  notes: {
    save: 'papers:notes:save'
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
      createPaperFromPdfBytes: (request: CreatePaperFromPdfBytesRequest) => Promise<PaperDetail>;
      importPdf: (request: {
        libraryRoot: string;
        directoryPath?: string;
      }) => Promise<PaperDetail | null>;
    };
    papers: {
      list: (request: ListPapersRequest) => Promise<PaperSummary[]>;
      get: (request: { libraryRoot: string; paperId: string }) => Promise<PaperDetail | null>;
    };
    tags: {
      list: (request: { libraryRoot: string }) => Promise<PaperTag[]>;
      upsert: (request: { libraryRoot: string; name: string; color?: string }) => Promise<PaperTag>;
      attach: (request: {
        libraryRoot: string;
        paperId: string;
        tagId: string;
      }) => Promise<PaperDetail | null>;
      detach: (request: {
        libraryRoot: string;
        paperId: string;
        tagId: string;
      }) => Promise<PaperDetail | null>;
    };
    notes: {
      save: (request: {
        libraryRoot: string;
        paperId: string;
        content: string;
      }) => Promise<PaperDetail | null>;
    };
    pdf: {
      loadBytes: (request: { libraryRoot: string; pdfPath: string }) => Promise<ArrayBuffer>;
      openExternal: (request: { libraryRoot: string; pdfPath: string }) => Promise<void>;
    };
  };
}
