import type { GlobalConfig } from '@tnet/shared/types/config';
import type { FileItem } from '@tnet/shared/types/file';

export interface OpenDirectoryResult {
  rootPath: string;
  fileTree: FileItem[];
}

export interface WorkspacePathRequest {
  rootDir: string;
  path: string;
}

export interface RenameWorkspacePathRequest {
  rootDir: string;
  oldPath: string;
  newPath: string;
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
    rename: (request: RenameWorkspacePathRequest) => Promise<void>;
    move: (request: RenameWorkspacePathRequest) => Promise<void>;
  };
  session: {
    load: (rootDir: string) => Promise<unknown>;
    save: (rootDir: string, session: unknown) => Promise<void>;
  };
  config: {
    loadGlobal: () => Promise<GlobalConfig>;
    saveGlobal: (config: GlobalConfig) => Promise<void>;
  };
}
