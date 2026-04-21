import { app, dialog, ipcMain } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import { getFileTree } from '@main/services/fileTreeService';

export const registerWorkspaceIpc = (): void => {
  ipcMain.handle(ipcChannels.workspace.openDirectory, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Open workspace',
      defaultPath: app.getPath('documents')
    });

    if (canceled || filePaths.length === 0) {
      return {
        rootPath: '',
        fileTree: []
      };
    }

    return {
      rootPath: filePaths[0],
      fileTree: await getFileTree(filePaths[0])
    };
  });

  ipcMain.handle(ipcChannels.workspace.getFileTree, async (_event, dirPath: string) => {
    return getFileTree(dirPath);
  });
};
