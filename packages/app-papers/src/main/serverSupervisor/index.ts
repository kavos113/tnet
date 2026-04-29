import { app } from 'electron';
import { PapersServerSupervisor } from './papersServerSupervisor';
import { resolvePapersServerCommand } from './papersServerCommand';

export const createPapersServerSupervisor = (): PapersServerSupervisor =>
  new PapersServerSupervisor({
    command: resolvePapersServerCommand({
      appPath: app.getAppPath(),
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
      userDataDir: app.getPath('userData')
    })
  });

export * from './papersServerCommand';
export * from './papersServerHealth';
export * from './papersServerSupervisor';
