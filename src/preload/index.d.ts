import { ElectronAPI } from '@electron-toolkit/preload';
import { FileItem } from '@fixtures/file';

interface ElectronFileAPI {
  getFileTree: (dirPath: string) => Promise<FileItem[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string, rootDir: string) => Promise<void>;
  createFile: (filePath: string) => Promise<void>;
  saveSession: (rootDir: string, filePaths: string[]) => Promise<void>;
  loadSession: (rootDir: string) => Promise<string[]>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI: ElectronFileAPI;
    api: unknown;
  }
}
