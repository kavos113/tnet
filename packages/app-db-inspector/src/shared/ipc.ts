import type {
  DatabaseSchemaSnapshot,
  DbInspectorWorkspace,
  LoadTablePageRequest,
  QueryExecutionResult,
  QueryHistoryEntry,
  TablePageResult
} from './dbInspectorTypes';
import type { DbInspectorGlobalConfig, DbInspectorWorkspaceSettings } from './config';

export const dbInspectorIpcChannels = {
  config: {
    loadGlobal: 'db-inspector:config:loadGlobal',
    saveGlobal: 'db-inspector:config:saveGlobal'
  },
  workspaces: {
    list: 'db-inspector:workspaces:list',
    create: 'db-inspector:workspaces:create',
    update: 'db-inspector:workspaces:update',
    remove: 'db-inspector:workspaces:remove',
    getSettings: 'db-inspector:workspaces:getSettings',
    saveSettings: 'db-inspector:workspaces:saveSettings',
    testConnection: 'db-inspector:workspaces:testConnection'
  },
  schema: {
    refresh: 'db-inspector:schema:refresh',
    getTree: 'db-inspector:schema:getTree'
  },
  tableData: {
    loadPage: 'db-inspector:tableData:loadPage'
  },
  query: {
    execute: 'db-inspector:query:execute',
    listHistory: 'db-inspector:query:listHistory'
  },
  files: {
    selectSqliteDatabase: 'db-inspector:files:selectSqliteDatabase'
  }
} as const;

export interface DbInspectorApi {
  dbInspector: {
    config: {
      loadGlobal: () => Promise<DbInspectorGlobalConfig>;
      saveGlobal: (config: DbInspectorGlobalConfig) => Promise<void>;
    };
    workspaces: {
      list: () => Promise<DbInspectorWorkspace[]>;
      create: (request: {
        name: string;
        databasePath: string;
        readOnly?: boolean;
      }) => Promise<DbInspectorWorkspace>;
      update: (request: {
        workspaceId: string;
        name: string;
        databasePath: string;
        readOnly?: boolean;
      }) => Promise<DbInspectorWorkspace>;
      remove: (request: { workspaceId: string }) => Promise<void>;
      getSettings: (request: { workspaceId: string }) => Promise<DbInspectorWorkspaceSettings>;
      saveSettings: (request: {
        workspaceId: string;
        settings: DbInspectorWorkspaceSettings;
      }) => Promise<void>;
      testConnection: (request: { workspaceId: string }) => Promise<void>;
    };
    schema: {
      refresh: (request: { workspaceId: string }) => Promise<DatabaseSchemaSnapshot>;
      getTree: (request: { workspaceId: string }) => Promise<DatabaseSchemaSnapshot | null>;
    };
    tableData: {
      loadPage: (request: LoadTablePageRequest) => Promise<TablePageResult>;
    };
    query: {
      execute: (request: {
        workspaceId: string;
        sqlText: string;
        maxRows?: number;
      }) => Promise<QueryExecutionResult>;
      listHistory: (request: { workspaceId: string }) => Promise<QueryHistoryEntry[]>;
    };
    files: {
      selectSqliteDatabase: () => Promise<{ path: string; name: string } | null>;
    };
  };
}
