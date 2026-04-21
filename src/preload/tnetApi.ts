import { ipcRenderer } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import type { TnetApi } from '@shared/ipc/contracts';

export const tnetApi: TnetApi = {
  workspace: {
    openDirectory: () => ipcRenderer.invoke(ipcChannels.workspace.openDirectory),
    getFileTree: (dirPath) => ipcRenderer.invoke(ipcChannels.workspace.getFileTree, dirPath)
  },
  file: {
    read: (filePath) => ipcRenderer.invoke(ipcChannels.file.read, filePath),
    write: (filePath, content, rootDir) =>
      ipcRenderer.invoke(ipcChannels.file.write, filePath, content, rootDir),
    create: (filePath) => ipcRenderer.invoke(ipcChannels.file.create, filePath),
    createDirectory: (dirPath) => ipcRenderer.invoke(ipcChannels.file.createDirectory, dirPath),
    delete: (filePath, rootDir) => ipcRenderer.invoke(ipcChannels.file.delete, filePath, rootDir),
    rename: (oldPath, newPath, rootDir) =>
      ipcRenderer.invoke(ipcChannels.file.rename, oldPath, newPath, rootDir)
  },
  session: {
    load: (rootDir) => ipcRenderer.invoke(ipcChannels.session.load, rootDir),
    save: (rootDir, session) => ipcRenderer.invoke(ipcChannels.session.save, rootDir, session)
  },
  config: {
    loadGlobal: () => ipcRenderer.invoke(ipcChannels.config.loadGlobal),
    saveGlobal: (config) => ipcRenderer.invoke(ipcChannels.config.saveGlobal, config),
    loadProject: (rootDir) => ipcRenderer.invoke(ipcChannels.config.loadProject, rootDir),
    saveProject: (rootDir, config) =>
      ipcRenderer.invoke(ipcChannels.config.saveProject, rootDir, config)
  },
  keyword: {
    loadIndex: (rootDir) => ipcRenderer.invoke(ipcChannels.keyword.loadIndex, rootDir),
    getContent: (filePath, name) =>
      ipcRenderer.invoke(ipcChannels.keyword.getContent, filePath, name)
  }
};
