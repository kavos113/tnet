import { ipcMain } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import {
  createDirectory,
  createFile,
  deleteFile,
  readFile,
  renamePath,
  writeFile
} from '@main/services/fileService';

export const registerFileIpc = (): void => {
  ipcMain.handle(ipcChannels.file.read, async (_event, filePath: string) => readFile(filePath));
  ipcMain.handle(
    ipcChannels.file.write,
    async (_event, filePath: string, content: string, rootDir: string) =>
      writeFile(filePath, content, rootDir)
  );
  ipcMain.handle(ipcChannels.file.create, async (_event, filePath: string) => createFile(filePath));
  ipcMain.handle(ipcChannels.file.createDirectory, async (_event, dirPath: string) =>
    createDirectory(dirPath)
  );
  ipcMain.handle(ipcChannels.file.delete, async (_event, filePath: string, rootDir: string) =>
    deleteFile(filePath, rootDir)
  );
  ipcMain.handle(
    ipcChannels.file.rename,
    async (_event, oldPath: string, newPath: string, rootDir: string) =>
      renamePath(oldPath, newPath, rootDir)
  );
};
