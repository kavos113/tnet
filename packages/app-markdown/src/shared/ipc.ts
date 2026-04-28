import type {
  WorkspaceSearchIndexStats,
  WorkspaceSearchRequest,
  WorkspaceSearchResponse
} from '@tnet/shared/search/searchTypes';
import type { KeywordContentRequest } from '@tnet/shared/ipc/contracts';
import type { MarkdownProjectConfig } from './config';

export const markdownIpcChannels = {
  config: {
    loadProject: 'markdown:config:loadProject',
    saveProject: 'markdown:config:saveProject'
  }
} as const;

export interface MarkdownApi {
  markdown: {
    config: {
      loadProject: (rootDir: string) => Promise<MarkdownProjectConfig>;
      saveProject: (rootDir: string, config: MarkdownProjectConfig) => Promise<void>;
    };
  };
}

export interface LegacyMarkdownApi {
  keyword: {
    loadIndex: (rootDir: string) => Promise<Record<string, string>>;
    getContent: (request: KeywordContentRequest) => Promise<string | null>;
  };
  search: {
    rebuild: (rootDir: string) => Promise<WorkspaceSearchIndexStats>;
    workspace: (request: WorkspaceSearchRequest) => Promise<WorkspaceSearchResponse>;
  };
}
