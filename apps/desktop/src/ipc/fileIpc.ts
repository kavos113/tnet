import { ipcMain, shell } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import {
  createDirectory,
  createFile,
  deleteFile,
  readImage,
  readFile,
  renamePath,
  saveImage,
  writeFile,
  type ReadWorkspaceImageRequest,
  type SaveWorkspaceImageRequest,
  type WriteWorkspaceFileRequest
} from '@main/services/fileService';
import type {
  RenameWorkspacePathRequest,
  WorkspacePathRequest
} from '@tnet/main-core/workspace/workspacePath';
import { resolveWorkspacePath } from '@tnet/main-core/workspace/workspacePath';

export const registerFileIpc = (): void => {
  ipcMain.handle(ipcChannels.file.read, async (_event, request: WorkspacePathRequest) =>
    readFile(request)
  );
  ipcMain.handle(
    ipcChannels.file.openWithDefaultApp,
    async (_event, request: WorkspacePathRequest) => {
      const filePath = resolveWorkspacePath(request);
      const errorMessage = await shell.openPath(filePath);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
    }
  );
  ipcMain.handle(ipcChannels.file.write, async (_event, request: WriteWorkspaceFileRequest) =>
    writeFile(request)
  );
  ipcMain.handle(ipcChannels.file.saveImage, async (_event, request: SaveWorkspaceImageRequest) =>
    saveImage(request)
  );
  ipcMain.handle(ipcChannels.file.readImage, async (_event, request: ReadWorkspaceImageRequest) =>
    readImage(request)
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
