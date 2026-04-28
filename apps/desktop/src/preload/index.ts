import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { tnetApi } from './tnetApi';

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('tnet', tnetApi);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.tnet = tnetApi;
}
