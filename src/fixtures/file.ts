export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
}

export interface SessionData {
  openedFiles: string[];
  expandedFolders: string[];
}
