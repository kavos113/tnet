import { registerMarkdownIpcHandlers } from '@tnet/app-markdown/main';
import { registerConfigIpc } from './configIpc';
import { registerFileIpc } from './fileIpc';
import { registerLlmIpc } from './llmIpc';
import { registerSessionIpc } from './sessionIpc';
import { registerWorkspaceIpc } from './workspaceIpc';

export const registerIpcHandlers = (): void => {
  registerWorkspaceIpc();
  registerFileIpc();
  registerSessionIpc();
  registerConfigIpc();
  registerMarkdownIpcHandlers();
  registerLlmIpc();
};
