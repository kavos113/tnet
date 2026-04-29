import { registerKeywordIpc } from './keywordIpc';
import { registerMarkdownFileIpc } from './markdownFileIpc';
import { registerMarkdownConfigIpc } from './markdownConfigIpc';
import { registerMarkdownLlmIpc } from './markdownLlmIpc';
import type { MarkdownSessionFileStateStore } from './markdownSessionFileState';
import { registerSearchIpc } from './searchIpc';

export const registerMarkdownIpcHandlers = (sessionStore: MarkdownSessionFileStateStore): void => {
  registerMarkdownConfigIpc();
  registerMarkdownFileIpc(sessionStore);
  registerKeywordIpc();
  registerSearchIpc();
  registerMarkdownLlmIpc();
};

export * from './keywordService';
export * from './markdownFileService';
export * from './markdownConfigService';
export * from './markdownSessionFileState';
export * from './workspaceSearchIndexService';
