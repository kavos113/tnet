import { registerKeywordIpc } from './keywordIpc';
import { registerMarkdownConfigIpc } from './markdownConfigIpc';
import { registerSearchIpc } from './searchIpc';

export const registerMarkdownIpcHandlers = (): void => {
  registerMarkdownConfigIpc();
  registerKeywordIpc();
  registerSearchIpc();
};

export * from './keywordService';
export * from './markdownConfigService';
export * from './workspaceSearchIndexService';
