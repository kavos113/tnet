import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  DatabaseSchemaSnapshot,
  DbInspectorWorkspace,
  ExplainQueryResult,
  QueryExecutionResult,
  QueryHistoryEntry,
  QueryTab,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type {
  DbInspectorGlobalSettings,
  DbInspectorWorkspaceSettings
} from '@tnet/app-db-inspector/shared/config';
import {
  defaultDbInspectorGlobalSettings,
  defaultDbInspectorWorkspaceSettings
} from '@tnet/app-db-inspector/shared/config';

interface DbInspectorState {
  activeWorkspaceId?: string;
  workspaces: DbInspectorWorkspace[];
  schema?: DatabaseSchemaSnapshot;
  activeTableName?: string;
  activeTable?: TablePageResult;
  queryTabs: QueryTab[];
  activeQueryTabId?: string;
  queryHistory: QueryHistoryEntry[];
  queryResult?: QueryExecutionResult;
  explainResult?: ExplainQueryResult;
  queryError?: string;
  settings: DbInspectorWorkspaceSettings;
  globalSettings: DbInspectorGlobalSettings;
  isRestored: boolean;
  isLoading: boolean;
  error?: string;
}

const initialState: DbInspectorState = {
  workspaces: [],
  queryTabs: [],
  queryHistory: [],
  settings: defaultDbInspectorWorkspaceSettings(),
  globalSettings: defaultDbInspectorGlobalSettings(),
  isRestored: false,
  isLoading: false
};

const dbInspectorSlice = createSlice({
  name: 'dbInspector',
  initialState,
  reducers: {
    restoreDbInspector: (
      state,
      action: PayloadAction<{
        activeWorkspaceId?: string;
        workspaces: DbInspectorWorkspace[];
        schema?: DatabaseSchemaSnapshot;
        queryTabs?: QueryTab[];
        queryHistory?: QueryHistoryEntry[];
        settings?: DbInspectorWorkspaceSettings;
        globalSettings?: DbInspectorGlobalSettings;
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.schema = action.payload.schema;
      state.queryTabs = action.payload.queryTabs ?? [];
      state.activeQueryTabId = action.payload.queryTabs?.[0]?.id;
      state.queryHistory = action.payload.queryHistory ?? [];
      state.settings = action.payload.settings ?? defaultDbInspectorWorkspaceSettings();
      state.globalSettings = action.payload.globalSettings ?? defaultDbInspectorGlobalSettings();
      state.isRestored = true;
    },
    setDbInspectorWorkspace: (
      state,
      action: PayloadAction<{
        activeWorkspaceId?: string;
        workspaces: DbInspectorWorkspace[];
        schema?: DatabaseSchemaSnapshot;
        queryTabs?: QueryTab[];
        queryHistory?: QueryHistoryEntry[];
        settings?: DbInspectorWorkspaceSettings;
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.schema = action.payload.schema;
      state.activeTableName = undefined;
      state.activeTable = undefined;
      state.queryTabs = action.payload.queryTabs ?? [];
      state.activeQueryTabId = action.payload.queryTabs?.[0]?.id;
      state.queryHistory = action.payload.queryHistory ?? [];
      state.queryResult = undefined;
      state.explainResult = undefined;
      state.queryError = undefined;
      state.settings = action.payload.settings ?? defaultDbInspectorWorkspaceSettings();
      state.isRestored = true;
    },
    setDbInspectorSchema: (state, action: PayloadAction<DatabaseSchemaSnapshot | undefined>) => {
      state.schema = action.payload;
    },
    setDbInspectorActiveTable: (
      state,
      action: PayloadAction<{ tableName: string; table: TablePageResult }>
    ) => {
      state.activeTableName = action.payload.tableName;
      state.activeTable = action.payload.table;
    },
    setDbInspectorQueryTabs: (state, action: PayloadAction<QueryTab[]>) => {
      state.queryTabs = action.payload;
      state.activeQueryTabId =
        state.activeQueryTabId && action.payload.some((tab) => tab.id === state.activeQueryTabId)
          ? state.activeQueryTabId
          : action.payload[0]?.id;
    },
    setActiveDbInspectorQueryTab: (state, action: PayloadAction<string | undefined>) => {
      state.activeQueryTabId = action.payload;
    },
    setDbInspectorQueryHistory: (state, action: PayloadAction<QueryHistoryEntry[]>) => {
      state.queryHistory = action.payload;
    },
    setDbInspectorQueryResult: (state, action: PayloadAction<QueryExecutionResult | undefined>) => {
      state.queryResult = action.payload;
      if (action.payload) state.queryError = undefined;
    },
    setDbInspectorExplainResult: (state, action: PayloadAction<ExplainQueryResult | undefined>) => {
      state.explainResult = action.payload;
      if (action.payload) state.queryError = undefined;
    },
    setDbInspectorQueryError: (state, action: PayloadAction<string | undefined>) => {
      state.queryError = action.payload;
      if (action.payload) {
        state.queryResult = undefined;
        state.explainResult = undefined;
      }
    },
    setDbInspectorLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setDbInspectorSettings: (state, action: PayloadAction<DbInspectorWorkspaceSettings>) => {
      state.settings = action.payload;
    },
    setDbInspectorGlobalSettings: (state, action: PayloadAction<DbInspectorGlobalSettings>) => {
      state.globalSettings = {
        ...defaultDbInspectorGlobalSettings(),
        ...action.payload
      };
    },
    setDbInspectorError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    }
  }
});

export const {
  restoreDbInspector,
  setActiveDbInspectorQueryTab,
  setDbInspectorActiveTable,
  setDbInspectorError,
  setDbInspectorExplainResult,
  setDbInspectorGlobalSettings,
  setDbInspectorLoading,
  setDbInspectorQueryError,
  setDbInspectorQueryHistory,
  setDbInspectorQueryResult,
  setDbInspectorQueryTabs,
  setDbInspectorSchema,
  setDbInspectorSettings,
  setDbInspectorWorkspace
} = dbInspectorSlice.actions;

export default dbInspectorSlice.reducer;
