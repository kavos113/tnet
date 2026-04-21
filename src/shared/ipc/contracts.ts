import type { GlobalConfig, ProjectConfig } from '@shared/types/config';
import type { FileItem, SessionData } from '@shared/types/file';

export interface OpenDirectoryResult {
  rootPath: string;
  fileTree: FileItem[];
}

export interface TnetApi {
  workspace: {
    openDirectory: () => Promise<OpenDirectoryResult>;
    getFileTree: (dirPath: string) => Promise<FileItem[]>;
  };
  file: {
    read: (filePath: string) => Promise<string>;
    write: (filePath: string, content: string, rootDir: string) => Promise<void>;
    create: (filePath: string) => Promise<void>;
    createDirectory: (dirPath: string) => Promise<void>;
    delete: (filePath: string, rootDir: string) => Promise<void>;
    rename: (oldPath: string, newPath: string, rootDir: string) => Promise<void>;
  };
  session: {
    load: (rootDir: string) => Promise<SessionData>;
    save: (rootDir: string, session: SessionData) => Promise<void>;
  };
  config: {
    loadGlobal: () => Promise<GlobalConfig>;
    saveGlobal: (config: GlobalConfig) => Promise<void>;
    loadProject: (rootDir: string) => Promise<ProjectConfig>;
    saveProject: (rootDir: string, config: ProjectConfig) => Promise<void>;
  };
  keyword: {
    loadIndex: (rootDir: string) => Promise<Record<string, string>>;
    getContent: (filePath: string, name: string) => Promise<string | null>;
  };
}
