import type { GlobalConfig } from '@tnet/shared/types/config';
import type { FileItem, SessionData } from '@tnet/shared/types/file';

export interface OpenDirectoryResult {
  rootPath: string;
  fileTree: FileItem[];
}

export interface WorkspacePathRequest {
  rootDir: string;
  path: string;
}

export interface TnetApi {
  workspace: {
    openDirectory: () => Promise<OpenDirectoryResult>;
    getFileTree: (rootDir: string) => Promise<FileItem[]>;
  };
  file: {
    read: (request: WorkspacePathRequest) => Promise<string>;
    openWithDefaultApp: (request: WorkspacePathRequest) => Promise<void>;
    createDirectory: (request: WorkspacePathRequest) => Promise<void>;
  };
  session: {
    load: (rootDir: string) => Promise<SessionData>;
    save: (rootDir: string, session: SessionData) => Promise<void>;
  };
  config: {
    loadGlobal: () => Promise<GlobalConfig>;
    saveGlobal: (config: GlobalConfig) => Promise<void>;
  };
}
