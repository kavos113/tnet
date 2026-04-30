import type { RequesterGlobalConfig, RequesterWorkspaceSettings } from './config';
import type {
  RequesterRequestDetail,
  RequesterRequestSummary,
  RequesterVariableSet,
  RequesterWorkspace,
  SaveRequesterRequestInput
} from './requesterTypes';

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
    list: 'requester:requests:list',
    get: 'requester:requests:get',
    save: 'requester:requests:save',
    duplicate: 'requester:requests:duplicate',
    rename: 'requester:requests:rename',
    reorder: 'requester:requests:reorder',
    remove: 'requester:requests:remove'
  },
  variableSets: {
    list: 'requester:variableSets:list',
    save: 'requester:variableSets:save',
    remove: 'requester:variableSets:remove',
    setActive: 'requester:variableSets:setActive'
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
      get: (request: { requestId: string }) => Promise<RequesterRequestDetail | null>;
      save: (request: SaveRequesterRequestInput) => Promise<RequesterRequestDetail>;
      duplicate: (request: { requestId: string }) => Promise<RequesterRequestDetail>;
      rename: (request: { requestId: string; name: string }) => Promise<RequesterRequestDetail>;
      reorder: (request: { workspaceId: string; requestIds: string[] }) => Promise<void>;
      remove: (request: { requestId: string }) => Promise<void>;
    };
    variableSets: {
      list: (request: { workspaceId: string }) => Promise<RequesterVariableSet[]>;
      save: (request: {
        id?: string;
        workspaceId: string;
        name: string;
      }) => Promise<RequesterVariableSet>;
      remove: (request: { variableSetId: string }) => Promise<void>;
      setActive: (request: { workspaceId: string; variableSetId?: string }) => Promise<void>;
    };
  };
}
