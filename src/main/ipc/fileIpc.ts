import { ipcMain } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import {
  createDirectory,
  createFile,
  deleteFile,
  readFile,
  renamePath,
  writeFile,
  type WriteWorkspaceFileRequest
} from '@main/services/fileService';
import type {
  RenameWorkspacePathRequest,
  WorkspacePathRequest
} from '@main/services/workspacePath';

export const registerFileIpc = (): void => {
  ipcMain.handle(ipcChannels.file.read, async (_event, request: WorkspacePathRequest) =>
    readFile(request)
  );
  ipcMain.handle(ipcChannels.file.write, async (_event, request: WriteWorkspaceFileRequest) =>
    writeFile(request)
  );
  ipcMain.handle(ipcChannels.file.create, async (_event, request: WorkspacePathRequest) =>
    createFile(request)
  );
  ipcMain.handle(ipcChannels.file.createDirectory, async (_event, request: WorkspacePathRequest) =>
    createDirectory(request)
  );
  ipcMain.handle(ipcChannels.file.delete, async (_event, request: WorkspacePathRequest) =>
    deleteFile(request)
  );
  ipcMain.handle(ipcChannels.file.rename, async (_event, request: RenameWorkspacePathRequest) =>
    renamePath(request)
  );
};
