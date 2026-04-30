import type { RequesterGlobalConfig, RequesterWorkspaceSettings } from './config';
import type { RequesterRequestSummary, RequesterWorkspace } from './requesterTypes';

export const requesterIpcChannels = {
  config: {
    loadGlobal: 'requester:config:loadGlobal',
    saveGlobal: 'requester:config:saveGlobal'
  },
  workspaces: {
    list: 'requester:workspaces:list',
    create: 'requester:workspaces:create',
    update: 'requester:workspaces:update',
    remove: 'requester:workspaces:remove',
    getSettings: 'requester:workspaces:getSettings',
    saveSettings: 'requester:workspaces:saveSettings'
  },
  requests: {
    list: 'requester:requests:list'
  }
} as const;

export interface RequesterApi {
  requester: {
    config: {
      loadGlobal: () => Promise<RequesterGlobalConfig>;
      saveGlobal: (config: RequesterGlobalConfig) => Promise<void>;
    };
    workspaces: {
      list: () => Promise<RequesterWorkspace[]>;
      create: (request: { name: string }) => Promise<RequesterWorkspace>;
      update: (request: { workspaceId: string; name: string }) => Promise<RequesterWorkspace>;
      remove: (request: { workspaceId: string }) => Promise<void>;
      getSettings: (request: { workspaceId: string }) => Promise<RequesterWorkspaceSettings>;
      saveSettings: (request: {
        workspaceId: string;
        settings: RequesterWorkspaceSettings;
      }) => Promise<void>;
    };
    requests: {
      list: (request: { workspaceId: string }) => Promise<RequesterRequestSummary[]>;
    };
  };
}
