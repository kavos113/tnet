import type { UnknownAction } from '@reduxjs/toolkit';
import type {
  DatabaseTable,
  DbInspectorDriverType,
  DbInspectorWorkspace
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import type {
  DbInspectorGlobalSettings,
  DbInspectorWorkspaceSettings
} from '@tnet/app-db-inspector/shared/config';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import {
  setDbInspectorActiveTable,
  setDbInspectorError,
  setDbInspectorLoading,
  setDbInspectorQueryError,
  setDbInspectorQueryHistory,
  setDbInspectorQueryResult,
  setDbInspectorQueryTabs,
  setDbInspectorSchema,
  setDbInspectorWorkspace
} from './dbInspectorSlice';

type DbInspectorDispatch = (action: UnknownAction) => unknown;

let schemaRefreshRequestId = 0;
let queryExecutionRequestId = 0;

export interface DbInspectorWorkspaceDraft {
  name: string;
  driver: DbInspectorDriverType;
  databasePath?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  sslMode?: string;
  readOnly?: boolean;
}

export const refreshDbInspectorWorkspace = async (
  dispatch: DbInspectorDispatch,
  workspaceId: string
): Promise<void> => {
  const [nextWorkspaces, nextSchema, nextSettings, queryTabs, queryHistory] = await Promise.all([
    dbInspectorTnetApi.dbInspector.workspaces.list(),
    dbInspectorTnetApi.dbInspector.schema.getTree({ workspaceId }),
    dbInspectorTnetApi.dbInspector.workspaces.getSettings({ workspaceId }),
    dbInspectorTnetApi.dbInspector.query.listTabs({ workspaceId }),
    dbInspectorTnetApi.dbInspector.query.listHistory({ workspaceId })
  ]);
  dispatch(
    setDbInspectorWorkspace({
      activeWorkspaceId: workspaceId,
      workspaces: nextWorkspaces,
      schema: nextSchema ?? undefined,
      queryTabs,
      queryHistory,
      settings: nextSettings
    })
  );
};

export const selectDbInspectorWorkspace = async (
  dispatch: DbInspectorDispatch,
  workspaceId: string
): Promise<void> => {
  dispatch(setDbInspectorLoading(true));
  try {
    await refreshDbInspectorWorkspace(dispatch, workspaceId);
    dispatch(setDbInspectorError(undefined));
  } catch (error) {
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
  } finally {
    dispatch(setDbInspectorLoading(false));
  }
};

const validateWorkspaceDraft = (
  input: DbInspectorWorkspaceDraft,
  dispatch: DbInspectorDispatch
): boolean => {
  if (input.driver === 'sqlite') {
    if (!input.databasePath?.trim()) {
      dispatch(setDbInspectorError('SQLite database path is required.'));
      return false;
    }
    return true;
  }

  if (!input.host?.trim() || !input.database?.trim() || !input.username?.trim()) {
    dispatch(setDbInspectorError('Host, database, and user are required.'));
    return false;
  }
  return true;
};

export const createDbInspectorWorkspace = async (
  dispatch: DbInspectorDispatch,
  input: DbInspectorWorkspaceDraft
): Promise<DbInspectorWorkspace | null> => {
  if (!validateWorkspaceDraft(input, dispatch)) return null;

  dispatch(setDbInspectorLoading(true));
  try {
    const workspace = await dbInspectorTnetApi.dbInspector.workspaces.create({
      name: input.name,
      driver: input.driver,
      databasePath: input.databasePath,
      host: input.host,
      port: input.port,
      database: input.database,
      username: input.username,
      password: input.password,
      sslMode: input.sslMode,
      readOnly: input.readOnly ?? true
    });
    const refreshedSchema = await dbInspectorTnetApi.dbInspector.schema.refresh({
      workspaceId: workspace.id
    });
    const [nextWorkspaces, queryTabs, queryHistory] = await Promise.all([
      dbInspectorTnetApi.dbInspector.workspaces.list(),
      dbInspectorTnetApi.dbInspector.query.listTabs({ workspaceId: workspace.id }),
      dbInspectorTnetApi.dbInspector.query.listHistory({ workspaceId: workspace.id })
    ]);
    dispatch(
      setDbInspectorWorkspace({
        activeWorkspaceId: workspace.id,
        workspaces: nextWorkspaces,
        schema: refreshedSchema,
        queryTabs,
        queryHistory
      })
    );
    dispatch(setDbInspectorError(undefined));
    return workspace;
  } catch (error) {
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
    return null;
  } finally {
    dispatch(setDbInspectorLoading(false));
  }
};

export const updateDbInspectorWorkspace = async (
  dispatch: DbInspectorDispatch,
  input: DbInspectorWorkspaceDraft & { workspaceId?: string }
): Promise<DbInspectorWorkspace | null> => {
  if (!input.workspaceId) return null;
  if (!validateWorkspaceDraft(input, dispatch)) return null;

  dispatch(setDbInspectorLoading(true));
  try {
    const workspace = await dbInspectorTnetApi.dbInspector.workspaces.update({
      workspaceId: input.workspaceId,
      name: input.name,
      driver: input.driver,
      databasePath: input.databasePath,
      host: input.host,
      port: input.port,
      database: input.database,
      username: input.username,
      password: input.password,
      sslMode: input.sslMode,
      readOnly: input.readOnly ?? true
    });
    await refreshDbInspectorWorkspace(dispatch, workspace.id);
    dispatch(setDbInspectorError(undefined));
    return workspace;
  } catch (error) {
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
    return null;
  } finally {
    dispatch(setDbInspectorLoading(false));
  }
};

export const testDbInspectorConnection = async (
  dispatch: DbInspectorDispatch,
  workspaceId?: string
): Promise<boolean> => {
  if (!workspaceId) return false;
  dispatch(setDbInspectorLoading(true));
  try {
    await dbInspectorTnetApi.dbInspector.workspaces.testConnection({ workspaceId });
    dispatch(setDbInspectorError(undefined));
    return true;
  } catch (error) {
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
    return false;
  } finally {
    dispatch(setDbInspectorLoading(false));
  }
};

export const executeDbInspectorQuery = async (
  dispatch: DbInspectorDispatch,
  input: { workspaceId?: string; sqlText: string; maxRows?: number }
): Promise<void> => {
  if (!input.workspaceId) return;
  const sqlText = input.sqlText.trim();
  if (!sqlText) {
    dispatch(setDbInspectorQueryError('SQL text is empty.'));
    return;
  }

  const requestId = ++queryExecutionRequestId;
  dispatch(setDbInspectorLoading(true));
  try {
    const result = await dbInspectorTnetApi.dbInspector.query.execute({
      workspaceId: input.workspaceId,
      sqlText,
      maxRows: input.maxRows
    });
    const history = await dbInspectorTnetApi.dbInspector.query.listHistory({
      workspaceId: input.workspaceId
    });
    if (requestId !== queryExecutionRequestId) return;
    dispatch(setDbInspectorQueryResult(result));
    dispatch(setDbInspectorQueryHistory(history));
  } catch (error) {
    const history = await dbInspectorTnetApi.dbInspector.query
      .listHistory({ workspaceId: input.workspaceId })
      .catch(() => undefined);
    if (requestId !== queryExecutionRequestId) return;
    if (history) dispatch(setDbInspectorQueryHistory(history));
    dispatch(setDbInspectorQueryError(error instanceof Error ? error.message : String(error)));
  } finally {
    if (requestId === queryExecutionRequestId) dispatch(setDbInspectorLoading(false));
  }
};

export const cancelDbInspectorQuery = (dispatch: DbInspectorDispatch): void => {
  queryExecutionRequestId += 1;
  dispatch(setDbInspectorLoading(false));
  dispatch(setDbInspectorQueryError('Query cancellation requested.'));
};

export const saveDbInspectorQueryTab = async (
  dispatch: DbInspectorDispatch,
  input: { id?: string; workspaceId?: string; title: string; sqlText: string }
): Promise<void> => {
  if (!input.workspaceId) return;
  const savedTab = await dbInspectorTnetApi.dbInspector.query.saveTab({
    id: input.id,
    workspaceId: input.workspaceId,
    title: input.title,
    sqlText: input.sqlText
  });
  const tabs = await dbInspectorTnetApi.dbInspector.query.listTabs({
    workspaceId: input.workspaceId
  });
  dispatch(setDbInspectorQueryTabs(tabs.length > 0 ? tabs : [savedTab]));
};

export const refreshDbInspectorSchema = async (
  dispatch: DbInspectorDispatch,
  workspaceId?: string
): Promise<void> => {
  if (!workspaceId) return;

  const requestId = ++schemaRefreshRequestId;
  dispatch(setDbInspectorLoading(true));
  try {
    const refreshedSchema = await dbInspectorTnetApi.dbInspector.schema.refresh({ workspaceId });
    if (requestId !== schemaRefreshRequestId) return;
    dispatch(setDbInspectorSchema(refreshedSchema));
    dispatch(setDbInspectorError(undefined));
  } catch (error) {
    if (requestId !== schemaRefreshRequestId) return;
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
  } finally {
    if (requestId === schemaRefreshRequestId) dispatch(setDbInspectorLoading(false));
  }
};

export const openDbInspectorTable = async (
  dispatch: DbInspectorDispatch,
  input: {
    table: DatabaseTable;
    page: number;
    filter: string;
    sort?: {
      column: string;
      direction: 'asc' | 'desc';
    };
    whereClause?: string;
    activeWorkspaceId?: string;
    settings: DbInspectorWorkspaceSettings;
    globalSettings: DbInspectorGlobalSettings;
  }
): Promise<void> => {
  if (!input.activeWorkspaceId) return;

  dispatch(setDbInspectorLoading(true));
  try {
    const pageResult = await dbInspectorTnetApi.dbInspector.tableData.loadPage({
      workspaceId: input.activeWorkspaceId,
      schemaName: input.table.schemaName,
      tableName: input.table.name,
      page: input.page,
      pageSize: input.settings.tablePageSize || input.globalSettings.defaultPageSize || 100,
      sort: input.sort,
      whereClause: input.whereClause,
      filter: input.filter
    });
    dispatch(setDbInspectorActiveTable({ tableName: input.table.name, table: pageResult }));
    dispatch(setDbInspectorError(undefined));
  } catch (error) {
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
  } finally {
    dispatch(setDbInspectorLoading(false));
  }
};
