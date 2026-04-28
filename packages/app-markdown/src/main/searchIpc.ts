import { ipcMain } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { WorkspaceSearchRequest } from '@tnet/shared/search/searchTypes';
import { rebuildWorkspaceSearchIndex, searchWorkspace } from './workspaceSearchIndexService';

export const registerSearchIpc = (): void => {
  ipcMain.handle(ipcChannels.search.rebuild, async (_event, rootDir: string) =>
    rebuildWorkspaceSearchIndex(rootDir)
  );
  ipcMain.handle(ipcChannels.search.workspace, async (_event, request: WorkspaceSearchRequest) =>
    searchWorkspace(request)
  );
};
