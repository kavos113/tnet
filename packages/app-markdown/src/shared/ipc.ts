import type {
  InlineCompletionRequest,
  InlineCompletionResult
} from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import type {
  WorkspaceSearchIndexStats,
  WorkspaceSearchRequest,
  WorkspaceSearchResponse
} from '@tnet/app-markdown/shared/search/searchTypes';
import type { WorkspacePathRequest } from '@tnet/shared/ipc/contracts';
import type { MarkdownProjectConfig } from './config';

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

export const markdownIpcChannels = {
  config: {
    loadProject: 'markdown:config:loadProject',
    saveProject: 'markdown:config:saveProject'
  },
  file: {
    write: 'markdown:file:write',
    saveImage: 'markdown:file:saveImage',
    readImage: 'markdown:file:readImage',
    create: 'markdown:file:create',
    delete: 'markdown:file:delete',
    rename: 'markdown:file:rename'
  },
  keyword: {
    loadIndex: 'markdown:keyword:loadIndex',
    getContent: 'markdown:keyword:getContent'
  },
  search: {
    rebuild: 'markdown:search:rebuild',
    workspace: 'markdown:search:workspace'
  },
  llm: {
    getInlineCompletion: 'markdown:llm:getInlineCompletion'
  }
} as const;

export interface MarkdownApi {
  markdown: {
    config: {
      loadProject: (rootDir: string) => Promise<MarkdownProjectConfig>;
      saveProject: (rootDir: string, config: MarkdownProjectConfig) => Promise<void>;
    };
    file: {
      write: (request: WriteWorkspaceFileRequest) => Promise<void>;
      saveImage: (request: SaveWorkspaceImageRequest) => Promise<SaveWorkspaceImageResult>;
      readImage: (request: ReadWorkspaceImageRequest) => Promise<ReadWorkspaceImageResult>;
      create: (request: WorkspacePathRequest) => Promise<void>;
      delete: (request: WorkspacePathRequest) => Promise<void>;
      rename: (request: RenameWorkspacePathRequest) => Promise<void>;
    };
    keyword: {
      loadIndex: (rootDir: string) => Promise<Record<string, string>>;
      getContent: (request: KeywordContentRequest) => Promise<string | null>;
    };
    search: {
      rebuild: (rootDir: string) => Promise<WorkspaceSearchIndexStats>;
      workspace: (request: WorkspaceSearchRequest) => Promise<WorkspaceSearchResponse>;
    };
    llm: {
      getInlineCompletion: (
        request: InlineCompletionRequest
      ) => Promise<InlineCompletionResult | null>;
    };
  };
}
