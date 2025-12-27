import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { GlobalConfig, ProjectConfig } from '@fixtures/config';

// Custom APIs for renderer
const api = {};

const electronFileAPI = {
  getNewFileTree: () => ipcRenderer.invoke('getNewFileTree'),
  getFileTree: (dirPath: string) => ipcRenderer.invoke('getFileTree', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),
  writeFile: (filePath: string, content: string, rootDir: string) =>
    ipcRenderer.invoke('writeFile', filePath, content, rootDir),
  createFile: (filePath: string) => ipcRenderer.invoke('createFile', filePath),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('createDirectory', dirPath),
  deleteFile: (filePath: string, rootDir: string) =>
    ipcRenderer.invoke('deleteFile', filePath, rootDir),
  renamePath: (oldPath: string, newPath: string, rootDir: string) =>
    ipcRenderer.invoke('renamePath', oldPath, newPath, rootDir),
  saveSession: (rootDir: string, filePaths: string[]) =>
    ipcRenderer.invoke('saveSession', rootDir, filePaths),
  loadSession: (rootDir: string) => ipcRenderer.invoke('loadSession', rootDir),
  loadKeywords: (rootDir: string) => ipcRenderer.invoke('loadKeywords', rootDir)
};

const electronConfigAPI = {
  loadConfig: () => ipcRenderer.invoke('loadConfig'),
  saveConfig: (config: GlobalConfig) => ipcRenderer.invoke('saveConfig', config),
  loadProjectConfig: (rootDir: string) => ipcRenderer.invoke('loadProjectConfig', rootDir),
  saveProjectConfig: (rootDir: string, config: ProjectConfig) =>
    ipcRenderer.invoke('saveProjectConfig', rootDir, config)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('electronAPI', electronFileAPI);
    contextBridge.exposeInMainWorld('electronConfigAPI', electronConfigAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.electronAPI = electronFileAPI;
  // @ts-ignore (define in dts)
  window.electronConfigAPI = electronConfigAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
