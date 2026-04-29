import { registerPapersConfigIpc } from './papersConfigIpc';
import { registerPapersDataIpc } from './papersIpc';
import { createPapersServerClient } from './serverClient/papersServerClient';

export interface RegisterPapersIpcHandlersOptions {
  userDataDir: string;
}

export const registerPapersIpcHandlers = ({
  userDataDir
}: RegisterPapersIpcHandlersOptions): void => {
  const serverClient = createPapersServerClient({ userDataDir });
  registerPapersConfigIpc(serverClient);
  registerPapersDataIpc(serverClient);
};

export * from './papersFileService';
export * from './papersPaths';
export * from './serverClient/papersServerClient';
export * from './serverSupervisor';
