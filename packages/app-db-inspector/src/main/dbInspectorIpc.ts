import { ipcMain } from 'electron';
import type { DbInspectorGlobalConfig } from '@tnet/app-db-inspector/shared/config';
import { dbInspectorIpcChannels } from '@tnet/app-db-inspector/shared/ipc';
import {
  loadDbInspectorGlobalConfig,
  saveDbInspectorGlobalConfig
} from './dbInspectorConfigService';
import {
  openDbInspectorDatabase,
  QueryHistoryRepository,
  SchemaCacheRepository,
  WorkspaceRepository
} from './repository';
import { DbInspectorService } from './service/dbInspectorService';
import { selectSqliteDatabaseFile } from './dbInspectorFileService';

export interface RegisterDbInspectorIpcOptions {
  userDataDir: string;
}

export const registerDbInspectorIpc = ({ userDataDir }: RegisterDbInspectorIpcOptions): void => {
  const database = openDbInspectorDatabase(userDataDir);
  const workspaceRepository = new WorkspaceRepository(database);
  const schemaCacheRepository = new SchemaCacheRepository(database);
  const queryHistoryRepository = new QueryHistoryRepository(database);
  const dbInspectorService = new DbInspectorService(
    workspaceRepository,
    schemaCacheRepository,
    queryHistoryRepository
  );

  ipcMain.handle(dbInspectorIpcChannels.config.loadGlobal, async () =>
    loadDbInspectorGlobalConfig(userDataDir)
  );
  ipcMain.handle(
    dbInspectorIpcChannels.config.saveGlobal,
    async (_event, config: DbInspectorGlobalConfig) =>
      saveDbInspectorGlobalConfig(userDataDir, config)
  );

  ipcMain.handle(dbInspectorIpcChannels.workspaces.list, async () => workspaceRepository.list());
  ipcMain.handle(dbInspectorIpcChannels.workspaces.create, async (_event, request) =>
    workspaceRepository.create({
      name: request.name,
      connection: {
        driver: 'sqlite',
        databasePath: request.databasePath,
        readOnly: request.readOnly ?? true
      }
    })
  );
  ipcMain.handle(dbInspectorIpcChannels.workspaces.update, async (_event, request) =>
    workspaceRepository.update({
      workspaceId: request.workspaceId,
      name: request.name,
      connection: {
        driver: 'sqlite',
        databasePath: request.databasePath,
        readOnly: request.readOnly ?? true
      }
    })
  );
  ipcMain.handle(dbInspectorIpcChannels.workspaces.remove, async (_event, request) => {
    workspaceRepository.remove(request.workspaceId);
  });
  ipcMain.handle(dbInspectorIpcChannels.workspaces.getSettings, async (_event, request) =>
    workspaceRepository.getSettings(request.workspaceId)
  );
  ipcMain.handle(dbInspectorIpcChannels.workspaces.saveSettings, async (_event, request) => {
    workspaceRepository.saveSettings(request.workspaceId, request.settings);
  });
  ipcMain.handle(dbInspectorIpcChannels.workspaces.testConnection, async (_event, request) =>
    dbInspectorService.testConnection(request.workspaceId)
  );

  ipcMain.handle(dbInspectorIpcChannels.schema.refresh, async (_event, request) =>
    dbInspectorService.refreshSchema(request.workspaceId)
  );
  ipcMain.handle(dbInspectorIpcChannels.schema.getTree, async (_event, request) =>
    dbInspectorService.getSchema(request.workspaceId)
  );
  ipcMain.handle(dbInspectorIpcChannels.tableData.loadPage, async (_event, request) =>
    dbInspectorService.loadTablePage(request)
  );
  ipcMain.handle(dbInspectorIpcChannels.query.execute, async (_event, request) =>
    dbInspectorService.executeQuery(request)
  );
  ipcMain.handle(dbInspectorIpcChannels.query.listHistory, async (_event, request) =>
    queryHistoryRepository.list(request.workspaceId)
  );
  ipcMain.handle(dbInspectorIpcChannels.files.selectSqliteDatabase, async () =>
    selectSqliteDatabaseFile()
  );
};
