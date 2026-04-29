import { registerMarkdownIpcHandlers } from '@tnet/app-markdown/main';
import { registerPapersIpcHandlers } from '@tnet/app-papers/main';
import { registerConfigIpc } from './configIpc';
import { registerFileIpc } from './fileIpc';
import { registerSessionIpc } from './sessionIpc';
import { registerWorkspaceIpc } from './workspaceIpc';
import { loadSession, saveSession } from '../services/sessionService';
import { app } from 'electron';

export const registerIpcHandlers = (): void => {
  registerWorkspaceIpc();
  registerFileIpc();
  registerSessionIpc();
  registerConfigIpc();
  registerMarkdownIpcHandlers({ loadSession, saveSession });
  registerPapersIpcHandlers({
    userDataDir: app.getPath('userData')
  });
};
