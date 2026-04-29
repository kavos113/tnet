import { registerPapersConfigIpc } from './papersConfigIpc';
import { registerPapersDataIpc } from './papersIpc';
import type { PapersGlobalConfigStore } from './papersConfigService';

export const registerPapersIpcHandlers = (store: PapersGlobalConfigStore): void => {
  registerPapersConfigIpc(store);
  registerPapersDataIpc();
};

export * from './papersDatabase';
export * from './papersConfigService';
export * from './papersFileService';
export * from './papersPaths';
export * from './papersRepository';
export * from './serverSupervisor';
