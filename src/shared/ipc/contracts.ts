import type { GlobalConfig, ProjectConfig } from '@shared/types/config';
import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@shared/llm/inlineCompletionTypes';
import type { FileItem, SessionData } from '@shared/types/file';

export interface OpenDirectoryResult {
  rootPath: string;
  fileTree: FileItem[];
}

export interface WorkspacePathRequest {
  rootDir: string;
  path: string;
}

export interface WriteWorkspaceFileRequest extends WorkspacePathRequest {
  content: string;
}

export interface SaveWorkspaceImageRequest {
  rootDir: string;
  preferredName?: string;
  mimeType: string;
  contentBase64: string;
}

export interface SaveWorkspaceImageResult {
  filename: string;
}

export interface ReadWorkspaceImageRequest {
  rootDir: string;
  filename: string;
}

export interface ReadWorkspaceImageResult {
  dataUrl: string;
}

export interface RenameWorkspacePathRequest {
  rootDir: string;
  oldPath: string;
  newPath: string;
}

export interface KeywordContentRequest extends WorkspacePathRequest {
  name: string;
}

export interface TnetApi {
  workspace: {
    openDirectory: () => Promise<OpenDirectoryResult>;
    getFileTree: (rootDir: string) => Promise<FileItem[]>;
  };
  file: {
    read: (request: WorkspacePathRequest) => Promise<string>;
    write: (request: WriteWorkspaceFileRequest) => Promise<void>;
    saveImage: (request: SaveWorkspaceImageRequest) => Promise<SaveWorkspaceImageResult>;
    readImage: (request: ReadWorkspaceImageRequest) => Promise<ReadWorkspaceImageResult>;
    create: (request: WorkspacePathRequest) => Promise<void>;
    createDirectory: (request: WorkspacePathRequest) => Promise<void>;
    delete: (request: WorkspacePathRequest) => Promise<void>;
    rename: (request: RenameWorkspacePathRequest) => Promise<void>;
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
    getContent: (request: KeywordContentRequest) => Promise<string | null>;
  };
  llm: {
    getInlineCompletion: (
      request: InlineCompletionRequest
    ) => Promise<InlineCompletionResult | null>;
  };
}
