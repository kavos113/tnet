import { ipcMain } from 'electron';
import type { RequesterGlobalConfig } from '@tnet/app-requester/shared/config';
import { requesterIpcChannels } from '@tnet/app-requester/shared/ipc';
import { loadRequesterGlobalConfig, saveRequesterGlobalConfig } from './requesterConfigService';
import {
  openRequesterDatabase,
  RequestRepository,
  VariableSetRepository,
  WorkspaceRepository
} from './repository';

export interface RegisterRequesterIpcOptions {
  userDataDir: string;
}

export const registerRequesterIpc = ({ userDataDir }: RegisterRequesterIpcOptions): void => {
  const database = openRequesterDatabase(userDataDir);
  const workspaceRepository = new WorkspaceRepository(database);
  const requestRepository = new RequestRepository(database);
  const variableSetRepository = new VariableSetRepository(database);

  ipcMain.handle(requesterIpcChannels.config.loadGlobal, async () =>
    loadRequesterGlobalConfig(userDataDir)
  );

  ipcMain.handle(
    requesterIpcChannels.config.saveGlobal,
    async (_event, config: RequesterGlobalConfig) => saveRequesterGlobalConfig(userDataDir, config)
  );

  ipcMain.handle(requesterIpcChannels.workspaces.list, async () => workspaceRepository.list());
  ipcMain.handle(requesterIpcChannels.workspaces.create, async (_event, request) =>
    workspaceRepository.create(request.name)
  );
  ipcMain.handle(requesterIpcChannels.workspaces.update, async (_event, request) =>
    workspaceRepository.update(request.workspaceId, request.name)
  );
  ipcMain.handle(requesterIpcChannels.workspaces.remove, async (_event, request) => {
    workspaceRepository.remove(request.workspaceId);
  });
  ipcMain.handle(requesterIpcChannels.workspaces.getSettings, async (_event, request) =>
    workspaceRepository.getSettings(request.workspaceId)
  );
  ipcMain.handle(requesterIpcChannels.workspaces.saveSettings, async (_event, request) => {
    workspaceRepository.saveSettings(request.workspaceId, request.settings);
  });

  ipcMain.handle(requesterIpcChannels.requests.list, async (_event, request) =>
    requestRepository.list(request.workspaceId)
  );
  ipcMain.handle(requesterIpcChannels.requests.get, async (_event, request) =>
    requestRepository.get(request.requestId)
  );
  ipcMain.handle(requesterIpcChannels.requests.save, async (_event, request) =>
    requestRepository.save(request)
  );
  ipcMain.handle(requesterIpcChannels.requests.duplicate, async (_event, request) =>
    requestRepository.duplicate(request.requestId)
  );
  ipcMain.handle(requesterIpcChannels.requests.rename, async (_event, request) =>
    requestRepository.rename(request.requestId, request.name)
  );
  ipcMain.handle(requesterIpcChannels.requests.reorder, async (_event, request) => {
    requestRepository.reorder(request.workspaceId, request.requestIds);
  });
  ipcMain.handle(requesterIpcChannels.requests.remove, async (_event, request) => {
    requestRepository.remove(request.requestId);
  });

  ipcMain.handle(requesterIpcChannels.variableSets.list, async (_event, request) =>
    variableSetRepository.list(request.workspaceId)
  );
  ipcMain.handle(requesterIpcChannels.variableSets.save, async (_event, request) =>
    variableSetRepository.save(request)
  );
  ipcMain.handle(requesterIpcChannels.variableSets.remove, async (_event, request) => {
    variableSetRepository.remove(request.variableSetId);
  });
  ipcMain.handle(requesterIpcChannels.variableSets.setActive, async (_event, request) => {
    const settings = workspaceRepository.getSettings(request.workspaceId);
    workspaceRepository.saveSettings(request.workspaceId, {
      ...settings,
      defaultVariableSetId: request.variableSetId
    });
  });
};
