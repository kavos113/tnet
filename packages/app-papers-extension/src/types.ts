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

export interface CreatePaperFromPdfBytesRequest {
  libraryRoot: string;
  directoryPath?: string;
  fileName: string;
  pdfBytes: Uint8Array<ArrayBuffer>;
  metadata: BibtexPaperMetadata;
  tags?: string[];
}
import type { BibtexPaperMetadata } from '@tnet/app-papers/shared/bibtex';
