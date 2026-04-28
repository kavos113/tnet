import { registerKeywordIpc } from './keywordIpc';
import { registerSearchIpc } from './searchIpc';

export const registerMarkdownIpcHandlers = (): void => {
  registerKeywordIpc();
  registerSearchIpc();
};

export * from './keywordService';
export * from './workspaceSearchIndexService';
