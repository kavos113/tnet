import { ipcMain } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import type { SessionData } from '@shared/types/file';
import { loadSession, saveSession } from '@main/services/sessionService';

export const registerSessionIpc = (): void => {
  ipcMain.handle(ipcChannels.session.load, async (_event, rootDir: string) => loadSession(rootDir));
  ipcMain.handle(ipcChannels.session.save, async (_event, rootDir: string, session: SessionData) =>
    saveSession(rootDir, session)
  );
};
