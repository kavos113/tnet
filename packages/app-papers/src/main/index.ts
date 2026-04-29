import { registerPapersConfigIpc } from './papersConfigIpc';
import type { PapersGlobalConfigStore } from './papersConfigService';

export const registerPapersIpcHandlers = (store: PapersGlobalConfigStore): void => {
  registerPapersConfigIpc(store);
};

export * from './papersDatabase';
export * from './papersConfigService';
export * from './papersPaths';
export * from './papersRepository';
