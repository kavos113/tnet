import { ElectronAPI } from '@electron-toolkit/preload';
import { GlobalConfig, ProjectConfig } from '@fixtures/config';
import { FileItem } from '@fixtures/file';

interface ElectronFileAPI {
  getNewFileTree: () => Promise<{ rootPath: string; fileTree: FileItem[] }>;
  getFileTree: (dirPath: string) => Promise<FileItem[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string, rootDir: string) => Promise<void>;
  createFile: (filePath: string) => Promise<void>;
  createDirectory: (dirPath: string) => Promise<void>;
  saveSession: (rootDir: string, filePaths: string[]) => Promise<void>;
  loadSession: (rootDir: string) => Promise<string[]>;
  loadKeywords: (rootDir: string) => Promise<Record<string, string>>;
}

interface ElectronConfigAPI {
  loadConfig: () => Promise<GlobalConfig>;
  saveConfig: (config: GlobalConfig) => Promise<void>;
  loadProjectConfig: (rootDir: string) => Promise<ProjectConfig>;
  saveProjectConfig: (rootDir: string, config: ProjectConfig) => Promise<void>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI: ElectronFileAPI;
    electronConfigAPI: ElectronConfigAPI;
    api: unknown;
  }
}
