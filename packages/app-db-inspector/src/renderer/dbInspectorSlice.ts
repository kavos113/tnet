import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  DatabaseSchemaSnapshot,
  DbInspectorWorkspace,
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
  settings: DbInspectorWorkspaceSettings;
  globalSettings: DbInspectorGlobalSettings;
  isRestored: boolean;
  isLoading: boolean;
  error?: string;
}

const initialState: DbInspectorState = {
  workspaces: [],
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
        settings?: DbInspectorWorkspaceSettings;
        globalSettings?: DbInspectorGlobalSettings;
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.schema = action.payload.schema;
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
        settings?: DbInspectorWorkspaceSettings;
      }>
    ) => {
      state.activeWorkspaceId = action.payload.activeWorkspaceId;
      state.workspaces = action.payload.workspaces;
      state.schema = action.payload.schema;
      state.activeTableName = undefined;
      state.activeTable = undefined;
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
    setDbInspectorLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setDbInspectorError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    }
  }
});

export const {
  restoreDbInspector,
  setDbInspectorActiveTable,
  setDbInspectorError,
  setDbInspectorLoading,
  setDbInspectorSchema,
  setDbInspectorWorkspace
} = dbInspectorSlice.actions;

export default dbInspectorSlice.reducer;
