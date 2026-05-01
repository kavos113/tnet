import { describe, expect, it } from 'vitest';
import type {
  DatabaseSchemaSnapshot,
  TablePageResult
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import {
  defaultDbInspectorGlobalSettings,
  defaultDbInspectorWorkspaceSettings
} from '@tnet/app-db-inspector/shared/config';
import reducer, {
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
} from './dbInspectorSlice';

const schema: DatabaseSchemaSnapshot = {
  refreshedAt: '2026-01-01T00:00:00.000Z',
  schemas: []
};

const table: TablePageResult = {
  columns: [{ name: 'id', type: 'INTEGER', nullable: false }],
  rows: [{ id: 1 }],
  page: 0,
  pageSize: 100,
  totalRows: 1
};

const workspace = {
  id: 'workspace-1',
  name: 'Local',
  driver: 'sqlite' as const,
  connection: { driver: 'sqlite' as const, databasePath: 'test.db', readOnly: true },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

const tab = {
  id: 'tab-1',
  workspaceId: 'workspace-1',
  title: 'Query',
  sqlText: 'SELECT 1',
  sortOrder: 0,
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('dbInspectorSlice', () => {
  it('restores persisted workspace state', () => {
    const state = reducer(
      undefined,
      restoreDbInspector({
        activeWorkspaceId: workspace.id,
        workspaces: [workspace],
        schema,
        queryTabs: [tab],
        queryHistory: [
          {
            id: 'h1',
            workspaceId: workspace.id,
            sqlText: 'SELECT 1',
            startedAt: '',
            durationMs: 1,
            rowCount: 1
          }
        ]
      })
    );

    expect(state).toMatchObject({
      activeWorkspaceId: workspace.id,
      activeQueryTabId: tab.id,
      isRestored: true,
      schema
    });
  });

  it('selects a workspace and clears table/query output state', () => {
    const dirtyState = reducer(
      undefined,
      setDbInspectorActiveTable({ tableName: 'authors', table })
    );
    const state = reducer(
      {
        ...dirtyState,
        queryResult: { columns: [], rows: [], durationMs: 1 },
        queryError: 'failed'
      },
      setDbInspectorWorkspace({
        activeWorkspaceId: workspace.id,
        workspaces: [workspace],
        schema,
        queryTabs: [tab]
      })
    );

    expect(state.activeTable).toBeUndefined();
    expect(state.activeTableName).toBeUndefined();
    expect(state.queryResult).toBeUndefined();
    expect(state.queryError).toBeUndefined();
    expect(state.activeQueryTabId).toBe(tab.id);
  });

  it('updates focused reducer fields', () => {
    let state = reducer(undefined, setDbInspectorSchema(schema));
    state = reducer(state, setDbInspectorActiveTable({ tableName: 'authors', table }));
    state = reducer(state, setDbInspectorQueryHistory([]));
    state = reducer(
      state,
      setDbInspectorSettings({
        ...defaultDbInspectorWorkspaceSettings(),
        readOnlyMode: false,
        queryTimeoutMs: 10,
        tablePageSize: 25
      })
    );
    state = reducer(
      state,
      setDbInspectorGlobalSettings({
        ...defaultDbInspectorGlobalSettings(),
        defaultPageSize: 50,
        gridFontFamily: 'Inter'
      })
    );
    state = reducer(state, setDbInspectorLoading(true));
    state = reducer(state, setDbInspectorError('workspace error'));

    expect(state).toMatchObject({
      schema,
      activeTableName: 'authors',
      activeTable: table,
      settings: { readOnlyMode: false, queryTimeoutMs: 10, tablePageSize: 25 },
      globalSettings: { defaultPageSize: 50, gridFontFamily: 'Inter' },
      isLoading: true,
      error: 'workspace error'
    });
  });

  it('keeps active query tab when it still exists and falls back otherwise', () => {
    const secondTab = { ...tab, id: 'tab-2' };
    let state = reducer(undefined, setDbInspectorQueryTabs([tab, secondTab]));
    state = reducer(state, setActiveDbInspectorQueryTab(secondTab.id));
    state = reducer(state, setDbInspectorQueryTabs([tab, secondTab]));
    expect(state.activeQueryTabId).toBe(secondTab.id);

    state = reducer(state, setDbInspectorQueryTabs([tab]));
    expect(state.activeQueryTabId).toBe(tab.id);
  });

  it('clears query errors when result or explain result arrives', () => {
    let state = reducer(undefined, setDbInspectorQueryError('failed'));
    state = reducer(state, setDbInspectorQueryResult({ columns: [], rows: [], durationMs: 3 }));
    expect(state.queryError).toBeUndefined();

    state = reducer(state, setDbInspectorQueryError('failed again'));
    state = reducer(state, setDbInspectorExplainResult({ nodes: [], durationMs: 1 }));
    expect(state.queryError).toBeUndefined();
  });

  it('clears query outputs when a query error arrives', () => {
    let state = reducer(
      undefined,
      setDbInspectorQueryResult({ columns: [], rows: [], durationMs: 3 })
    );
    state = reducer(state, setDbInspectorExplainResult({ nodes: [], durationMs: 1 }));
    state = reducer(state, setDbInspectorQueryError('failed'));

    expect(state.queryResult).toBeUndefined();
    expect(state.explainResult).toBeUndefined();
    expect(state.queryError).toBe('failed');
  });
});
