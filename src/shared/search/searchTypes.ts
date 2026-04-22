export interface WorkspaceSearchRequest {
  rootDir: string;
  query: string;
  limit?: number;
}

export interface SearchMatchRange {
  start: number;
  end: number;
}

export interface SearchLineMatch {
  lineNumber: number;
  lineText: string;
  ranges: SearchMatchRange[];
}

export interface SearchFileResult {
  path: string;
  relativePath: string;
  matches: SearchLineMatch[];
}

export interface WorkspaceSearchResponse {
  status: 'ready' | 'building';
  files: SearchFileResult[];
  totalMatches: number;
  truncated: boolean;
  indexedFileCount: number;
  indexedLineCount: number;
}

export interface WorkspaceSearchIndexStats {
  indexedFileCount: number;
  indexedLineCount: number;
}
