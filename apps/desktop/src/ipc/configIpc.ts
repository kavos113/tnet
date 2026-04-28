import { app, ipcMain } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { GlobalConfig } from '@tnet/shared/types/config';
import { loadGlobalConfig, saveGlobalConfig } from '@main/services/configService';

export const registerConfigIpc = (): void => {
  ipcMain.handle(ipcChannels.config.loadGlobal, async () =>
    loadGlobalConfig(app.getPath('userData'))
  );
  ipcMain.handle(ipcChannels.config.saveGlobal, async (_event, config: GlobalConfig) =>
    saveGlobalConfig(app.getPath('userData'), config)
  );
};
