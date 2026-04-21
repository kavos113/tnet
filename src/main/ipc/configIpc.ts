import { app, ipcMain } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import type { GlobalConfig, ProjectConfig } from '@shared/types/config';
import { loadGlobalConfig, saveGlobalConfig } from '@main/services/configService';
import { loadProjectConfig, saveProjectConfig } from '@main/services/projectConfigService';

export const registerConfigIpc = (): void => {
  ipcMain.handle(ipcChannels.config.loadGlobal, async () =>
    loadGlobalConfig(app.getPath('userData'))
  );
  ipcMain.handle(ipcChannels.config.saveGlobal, async (_event, config: GlobalConfig) =>
    saveGlobalConfig(app.getPath('userData'), config)
  );
  ipcMain.handle(ipcChannels.config.loadProject, async (_event, rootDir: string) =>
    loadProjectConfig(rootDir)
  );
  ipcMain.handle(
    ipcChannels.config.saveProject,
    async (_event, rootDir: string, config: ProjectConfig) => saveProjectConfig(rootDir, config)
  );
};
