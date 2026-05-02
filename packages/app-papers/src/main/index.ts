import { registerPapersConfigIpc } from './papersConfigIpc';
import { registerPapersDataIpc } from './papersIpc';
import { getPapersGlobalSettings } from '@tnet/app-papers/shared/config';
import { normalizeGlobalConfig, type GlobalConfig } from '@tnet/shared/types/config';
import { createPapersServerClient } from './serverClient/papersServerClient';

export interface RegisterPapersIpcHandlersOptions {
  userDataDir: string;
  loadGlobal: () => Promise<GlobalConfig>;
}

export const registerPapersIpcHandlers = ({
  loadGlobal,
  userDataDir
}: RegisterPapersIpcHandlersOptions): void => {
  const serverClient = createPapersServerClient({ userDataDir });
  registerPapersConfigIpc(serverClient);
  registerPapersDataIpc(serverClient, async () =>
    getPapersGlobalSettings(normalizeGlobalConfig(await loadGlobal()))
  );
};

export * from './papersFileService';
export * from './papersPaths';
export * from './serverClient/papersServerClient';
export * from './serverSupervisor';
