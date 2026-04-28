import { ipcMain } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import { getKeywordContent, loadKeywordIndex, type KeywordContentRequest } from './keywordService';

export const registerKeywordIpc = (): void => {
  ipcMain.handle(ipcChannels.keyword.loadIndex, async (_event, rootDir: string) =>
    loadKeywordIndex(rootDir)
  );
  ipcMain.handle(ipcChannels.keyword.getContent, async (_event, request: KeywordContentRequest) =>
    getKeywordContent(request)
  );
};
