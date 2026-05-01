import type { RequesterGlobalConfig, RequesterWorkspaceSettings } from './config';
import type {
  RequesterRequestDetail,
  RequesterExecutionResult,
  RequesterHistoryDetail,
  RequesterHistoryEntry,
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
  },
  execution: {
    send: 'requester:execution:send',
    abort: 'requester:execution:abort'
  },
  history: {
    list: 'requester:history:list',
    get: 'requester:history:get',
    remove: 'requester:history:remove',
    clear: 'requester:history:clear'
  },
  files: {
    selectBinaryBody: 'requester:files:selectBinaryBody',
    saveResponseBody: 'requester:files:saveResponseBody',
    openResponseExternally: 'requester:files:openResponseExternally'
  },
  graphql: {
    introspect: 'requester:graphql:introspect'
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
    execution: {
      send: (request: SaveRequesterRequestInput) => Promise<RequesterExecutionResult>;
      abort: (request: { executionId: string }) => Promise<void>;
    };
    history: {
      list: (request: {
        workspaceId: string;
        requestId?: string;
      }) => Promise<RequesterHistoryEntry[]>;
      get: (request: { historyId: string }) => Promise<RequesterHistoryDetail | null>;
      remove: (request: { historyId: string }) => Promise<void>;
      clear: (request: { workspaceId: string }) => Promise<void>;
    };
    files: {
      selectBinaryBody: () => Promise<{ path: string; name: string } | null>;
      saveResponseBody: (request: {
        suggestedName: string;
        bodyText: string;
        bodyBase64?: string;
      }) => Promise<string | null>;
      openResponseExternally: (request: {
        suggestedName: string;
        bodyText: string;
        bodyBase64?: string;
      }) => Promise<void>;
    };
    graphql: {
      introspect: (request: {
        workspaceId: string;
        endpointUrl: string;
        headers?: SaveRequesterRequestInput['headers'];
        auth?: Pick<
          SaveRequesterRequestInput,
          | 'authType'
          | 'authUsername'
          | 'authPassword'
          | 'authToken'
          | 'authApiKeyName'
          | 'authApiKeyValue'
        >;
      }) => Promise<{ schemaJson: string; fetchedAt: string }>;
    };
  };
}
