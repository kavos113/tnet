import { ipcMain } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import type { WorkspaceSearchRequest } from '@shared/search/searchTypes';
import {
  rebuildWorkspaceSearchIndex,
  searchWorkspace
} from '@main/services/workspaceSearchIndexService';

export const registerSearchIpc = (): void => {
  ipcMain.handle(ipcChannels.search.rebuild, async (_event, rootDir: string) =>
    rebuildWorkspaceSearchIndex(rootDir)
  );
  ipcMain.handle(ipcChannels.search.workspace, async (_event, request: WorkspaceSearchRequest) =>
    searchWorkspace(request)
  );
};
