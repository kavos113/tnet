import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {};

const electronFileAPI = {
  getFileTree: (dirPath: string) => ipcRenderer.invoke('getFileTree', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),
  writeFile: (filePath: string, content: string, rootDir: string) =>
    ipcRenderer.invoke('writeFile', filePath, content, rootDir),
  createFile: (filePath: string) => ipcRenderer.invoke('createFile', filePath),
  saveSession: (rootDir: string, filePaths: string[]) =>
    ipcRenderer.invoke('saveSession', rootDir, filePaths),
  loadSession: (rootDir: string) => ipcRenderer.invoke('loadSession', rootDir)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('electronAPI', electronFileAPI);
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
  window.api = api;
}
