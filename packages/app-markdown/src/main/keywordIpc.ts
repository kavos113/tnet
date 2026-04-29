import { ipcMain } from 'electron';
import { markdownIpcChannels } from '@tnet/app-markdown/shared/ipc';
import { getKeywordContent, loadKeywordIndex, type KeywordContentRequest } from './keywordService';

export const registerKeywordIpc = (): void => {
  ipcMain.handle(markdownIpcChannels.keyword.loadIndex, async (_event, rootDir: string) =>
    loadKeywordIndex(rootDir)
  );
  ipcMain.handle(
    markdownIpcChannels.keyword.getContent,
    async (_event, request: KeywordContentRequest) => getKeywordContent(request)
  );
};
