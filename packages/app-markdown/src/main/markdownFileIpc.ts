import { ipcMain } from 'electron';
import { markdownIpcChannels } from '@tnet/app-markdown/shared/ipc';
import type {
  ReadWorkspaceImageRequest,
  SaveWorkspaceImageRequest,
  WriteWorkspaceFileRequest
} from '@tnet/app-markdown/shared/ipc';
import type { WorkspacePathRequest } from '@tnet/shared/ipc/contracts';
import type { RenameWorkspacePathRequest } from '@tnet/main-core/workspace/workspacePath';
import {
  createMarkdownFile,
  deleteMarkdownFile,
  readMarkdownImage,
  renameMarkdownPath,
  saveMarkdownImage,
  writeMarkdownFile
} from './markdownFileService';
import type { MarkdownSessionFileStateStore } from './markdownSessionFileState';

export const registerMarkdownFileIpc = (sessionStore: MarkdownSessionFileStateStore): void => {
  ipcMain.handle(
    markdownIpcChannels.file.write,
    async (_event, request: WriteWorkspaceFileRequest) => writeMarkdownFile(request)
  );
  ipcMain.handle(
    markdownIpcChannels.file.saveImage,
    async (_event, request: SaveWorkspaceImageRequest) => saveMarkdownImage(request)
  );
  ipcMain.handle(
    markdownIpcChannels.file.readImage,
    async (_event, request: ReadWorkspaceImageRequest) => readMarkdownImage(request)
  );
  ipcMain.handle(markdownIpcChannels.file.create, async (_event, request: WorkspacePathRequest) =>
    createMarkdownFile(request)
  );
  ipcMain.handle(markdownIpcChannels.file.delete, async (_event, request: WorkspacePathRequest) =>
    deleteMarkdownFile(request, sessionStore)
  );
  ipcMain.handle(
    markdownIpcChannels.file.rename,
    async (_event, request: RenameWorkspacePathRequest) => renameMarkdownPath(request, sessionStore)
  );
};
