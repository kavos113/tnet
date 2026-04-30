import { ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import { requesterIpcChannels } from '@tnet/app-requester/shared/ipc';
import {
  defaultRequesterWorkspaceSettings,
  normalizeRequesterWorkspaceSettings,
  type RequesterGlobalConfig
} from '@tnet/app-requester/shared/config';
import { loadRequesterGlobalConfig, saveRequesterGlobalConfig } from './requesterConfigService';

export interface RegisterRequesterIpcOptions {
  userDataDir: string;
}

export const registerRequesterIpc = ({ userDataDir }: RegisterRequesterIpcOptions): void => {
  ipcMain.handle(requesterIpcChannels.config.loadGlobal, async () =>
    loadRequesterGlobalConfig(userDataDir)
  );

  ipcMain.handle(
    requesterIpcChannels.config.saveGlobal,
    async (_event, config: RequesterGlobalConfig) => saveRequesterGlobalConfig(userDataDir, config)
  );

  ipcMain.handle(requesterIpcChannels.workspaces.list, async () => []);
  ipcMain.handle(requesterIpcChannels.workspaces.create, async (_event, request) => ({
    id: randomUUID(),
    name: request.name
  }));
  ipcMain.handle(requesterIpcChannels.workspaces.update, async (_event, request) => ({
    id: request.workspaceId,
    name: request.name
  }));
  ipcMain.handle(requesterIpcChannels.workspaces.remove, async () => undefined);
  ipcMain.handle(requesterIpcChannels.workspaces.getSettings, async () =>
    defaultRequesterWorkspaceSettings()
  );
  ipcMain.handle(requesterIpcChannels.workspaces.saveSettings, async (_event, request) => {
    normalizeRequesterWorkspaceSettings(request.settings);
  });
  ipcMain.handle(requesterIpcChannels.requests.list, async () => []);
};
