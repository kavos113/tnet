import { ipcMain } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { MarkdownSessionData } from '@tnet/app-markdown/shared/session';
import { loadSession, saveSession } from '@main/services/sessionService';

export const registerSessionIpc = (): void => {
  ipcMain.handle(ipcChannels.session.load, async (_event, rootDir: string) => loadSession(rootDir));
  ipcMain.handle(
    ipcChannels.session.save,
    async (_event, rootDir: string, session: MarkdownSessionData) => saveSession(rootDir, session)
  );
};
