import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { DbInspectorApi } from '@tnet/app-db-inspector/shared/ipc';

const getApi = (): TnetApi & DbInspectorApi => getTnetApi<TnetApi & DbInspectorApi>();

export const dbInspectorTnetApi: DbInspectorApi = {
  dbInspector: {
    config: {
      loadGlobal: () => getApi().dbInspector.config.loadGlobal(),
      saveGlobal: (config) => getApi().dbInspector.config.saveGlobal(config)
    },
    workspaces: {
      list: () => getApi().dbInspector.workspaces.list(),
      create: (request) => getApi().dbInspector.workspaces.create(request),
      update: (request) => getApi().dbInspector.workspaces.update(request),
      remove: (request) => getApi().dbInspector.workspaces.remove(request),
      getSettings: (request) => getApi().dbInspector.workspaces.getSettings(request),
      saveSettings: (request) => getApi().dbInspector.workspaces.saveSettings(request),
      testConnection: (request) => getApi().dbInspector.workspaces.testConnection(request)
    },
    schema: {
      refresh: (request) => getApi().dbInspector.schema.refresh(request),
      getTree: (request) => getApi().dbInspector.schema.getTree(request)
    },
    tableData: {
      loadPage: (request) => getApi().dbInspector.tableData.loadPage(request)
    },
    query: {
      execute: (request) => getApi().dbInspector.query.execute(request),
      listHistory: (request) => getApi().dbInspector.query.listHistory(request)
    },
    files: {
      selectSqliteDatabase: () => getApi().dbInspector.files.selectSqliteDatabase()
    }
  }
};
