import { registerConfigIpc } from './configIpc';
import { registerFileIpc } from './fileIpc';
import { registerKeywordIpc } from './keywordIpc';
import { registerLlmIpc } from './llmIpc';
import { registerSessionIpc } from './sessionIpc';
import { registerWorkspaceIpc } from './workspaceIpc';

export const registerIpcHandlers = (): void => {
  registerWorkspaceIpc();
  registerFileIpc();
  registerSessionIpc();
  registerConfigIpc();
  registerKeywordIpc();
  registerLlmIpc();
};
