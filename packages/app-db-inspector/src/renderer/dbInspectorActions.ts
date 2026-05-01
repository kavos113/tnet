import type { UnknownAction } from '@reduxjs/toolkit';
import type {
  DatabaseTable,
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
  setDbInspectorSchema,
  setDbInspectorWorkspace
} from './dbInspectorSlice';

type DbInspectorDispatch = (action: UnknownAction) => unknown;

export const refreshDbInspectorWorkspace = async (
  dispatch: DbInspectorDispatch,
  workspaceId: string
): Promise<void> => {
  const [nextWorkspaces, nextSchema, nextSettings] = await Promise.all([
    dbInspectorTnetApi.dbInspector.workspaces.list(),
    dbInspectorTnetApi.dbInspector.schema.getTree({ workspaceId }),
    dbInspectorTnetApi.dbInspector.workspaces.getSettings({ workspaceId })
  ]);
  dispatch(
    setDbInspectorWorkspace({
      activeWorkspaceId: workspaceId,
      workspaces: nextWorkspaces,
      schema: nextSchema ?? undefined,
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

export const createSqliteWorkspace = async (
  dispatch: DbInspectorDispatch,
  input: { name: string; databasePath: string }
): Promise<DbInspectorWorkspace | null> => {
  if (!input.databasePath.trim()) {
    dispatch(setDbInspectorError('SQLite database path is required.'));
    return null;
  }

  dispatch(setDbInspectorLoading(true));
  try {
    const workspace = await dbInspectorTnetApi.dbInspector.workspaces.create({
      name: input.name,
      databasePath: input.databasePath,
      readOnly: true
    });
    const refreshedSchema = await dbInspectorTnetApi.dbInspector.schema.refresh({
      workspaceId: workspace.id
    });
    const nextWorkspaces = await dbInspectorTnetApi.dbInspector.workspaces.list();
    dispatch(
      setDbInspectorWorkspace({
        activeWorkspaceId: workspace.id,
        workspaces: nextWorkspaces,
        schema: refreshedSchema
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

export const refreshDbInspectorSchema = async (
  dispatch: DbInspectorDispatch,
  workspaceId?: string
): Promise<void> => {
  if (!workspaceId) return;

  dispatch(setDbInspectorLoading(true));
  try {
    const refreshedSchema = await dbInspectorTnetApi.dbInspector.schema.refresh({ workspaceId });
    dispatch(setDbInspectorSchema(refreshedSchema));
    dispatch(setDbInspectorError(undefined));
  } catch (error) {
    dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
  } finally {
    dispatch(setDbInspectorLoading(false));
  }
};

export const openDbInspectorTable = async (
  dispatch: DbInspectorDispatch,
  input: {
    table: DatabaseTable;
    page: number;
    filter: string;
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
