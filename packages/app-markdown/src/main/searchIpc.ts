import { ipcMain } from 'electron';
import { markdownIpcChannels } from '@tnet/app-markdown/shared/ipc';
import type { WorkspaceSearchRequest } from '@tnet/app-markdown/shared/search/searchTypes';
import { rebuildWorkspaceSearchIndex, searchWorkspace } from './workspaceSearchIndexService';

export const registerSearchIpc = (): void => {
  ipcMain.handle(markdownIpcChannels.search.rebuild, async (_event, rootDir: string) =>
    rebuildWorkspaceSearchIndex(rootDir)
  );
  ipcMain.handle(
    markdownIpcChannels.search.workspace,
    async (_event, request: WorkspaceSearchRequest) => searchWorkspace(request)
  );
};
