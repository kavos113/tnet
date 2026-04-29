import { registerPapersConfigIpc } from './papersConfigIpc';
import type { PapersGlobalConfigStore } from './papersConfigService';

export const registerPapersIpcHandlers = (store: PapersGlobalConfigStore): void => {
  registerPapersConfigIpc(store);
};

export * from './papersConfigService';
