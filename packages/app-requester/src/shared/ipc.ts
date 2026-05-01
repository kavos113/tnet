import type { RequesterGlobalConfig, RequesterWorkspaceSettings } from './config';
import type {
  RequesterRequestDetail,
  RequesterExecutionResult,
  RequesterHistoryDetail,
  RequesterHistoryEntry,
  RequesterCookie,
  RequesterRequestSummary,
  RequesterVariable,
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
    setActive: 'requester:variableSets:setActive',
    listVariables: 'requester:variableSets:listVariables'
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
  cookies: {
    list: 'requester:cookies:list',
    remove: 'requester:cookies:remove',
    clear: 'requester:cookies:clear'
  },
  secrets: {
    save: 'requester:secrets:save',
    has: 'requester:secrets:has'
  },
  files: {
    selectBinaryBody: 'requester:files:selectBinaryBody',
    selectGrpcProto: 'requester:files:selectGrpcProto',
    saveResponseBody: 'requester:files:saveResponseBody',
    openResponseExternally: 'requester:files:openResponseExternally'
  },
  graphql: {
    introspect: 'requester:graphql:introspect'
  },
  backup: {
    exportWorkspace: 'requester:backup:exportWorkspace',
    importWorkspace: 'requester:backup:importWorkspace'
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
      listVariables: (request: { variableSetId: string }) => Promise<RequesterVariable[]>;
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
    cookies: {
      list: (request: { workspaceId: string }) => Promise<RequesterCookie[]>;
      remove: (request: { cookieId: string }) => Promise<void>;
      clear: (request: { workspaceId: string }) => Promise<void>;
    };
    secrets: {
      save: (request: { value: string }) => Promise<{ secretId: string }>;
      has: (request: { secretId: string }) => Promise<{ exists: boolean }>;
    };
    files: {
      selectBinaryBody: () => Promise<{ path: string; name: string } | null>;
      selectGrpcProto: () => Promise<{ path: string; name: string } | null>;
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
    backup: {
      exportWorkspace: (request: { workspaceId: string }) => Promise<string | null>;
      importWorkspace: () => Promise<{ workspaceId: string } | null>;
    };
  };
}
