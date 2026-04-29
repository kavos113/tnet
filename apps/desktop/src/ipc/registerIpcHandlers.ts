import { registerMarkdownIpcHandlers } from '@tnet/app-markdown/main';
import { registerConfigIpc } from './configIpc';
import { registerFileIpc } from './fileIpc';
import { registerSessionIpc } from './sessionIpc';
import { registerWorkspaceIpc } from './workspaceIpc';
import { loadSession, saveSession } from '../services/sessionService';

export const registerIpcHandlers = (): void => {
  registerWorkspaceIpc();
  registerFileIpc();
  registerSessionIpc();
  registerConfigIpc();
  registerMarkdownIpcHandlers({ loadSession, saveSession });
};
