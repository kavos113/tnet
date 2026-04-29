import { ipcMain } from 'electron';
import { papersIpcChannels } from '@tnet/app-papers/shared/ipc';
import type { PapersGlobalConfig, PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import type { PapersServerClient } from './serverClient/papersServerClient';

export const registerPapersConfigIpc = (serverClient: PapersServerClient): void => {
  ipcMain.handle(papersIpcChannels.config.loadGlobal, async () => serverClient.loadGlobalConfig());
  ipcMain.handle(papersIpcChannels.config.saveGlobal, async (_event, config: PapersGlobalConfig) =>
    serverClient.saveGlobalConfig(config)
  );
  ipcMain.handle(papersIpcChannels.config.loadLibrary, async (_event, libraryRoot: string) =>
    serverClient.loadLibraryConfig(libraryRoot)
  );
  ipcMain.handle(
    papersIpcChannels.config.saveLibrary,
    async (_event, libraryRoot: string, config: PapersLibraryConfig) =>
      serverClient.saveLibraryConfig(libraryRoot, config)
  );
};
