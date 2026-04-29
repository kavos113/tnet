import { ipcMain } from 'electron';
import { papersIpcChannels } from '@tnet/app-papers/shared/ipc';
import type { PapersGlobalConfig, PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import {
  loadPapersGlobalConfig,
  loadPapersLibraryConfig,
  savePapersGlobalConfig,
  savePapersLibraryConfig,
  type PapersGlobalConfigStore
} from './papersConfigService';

export const registerPapersConfigIpc = (store: PapersGlobalConfigStore): void => {
  ipcMain.handle(papersIpcChannels.config.loadGlobal, async () => loadPapersGlobalConfig(store));
  ipcMain.handle(papersIpcChannels.config.saveGlobal, async (_event, config: PapersGlobalConfig) =>
    savePapersGlobalConfig(store, config)
  );
  ipcMain.handle(papersIpcChannels.config.loadLibrary, async (_event, libraryRoot: string) =>
    loadPapersLibraryConfig(libraryRoot)
  );
  ipcMain.handle(
    papersIpcChannels.config.saveLibrary,
    async (_event, libraryRoot: string, config: PapersLibraryConfig) =>
      savePapersLibraryConfig(libraryRoot, config)
  );
};
