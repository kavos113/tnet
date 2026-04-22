import { ipcRenderer } from 'electron';
import { ipcChannels } from '@shared/ipc/channels';
import type { TnetApi } from '@shared/ipc/contracts';

export const tnetApi: TnetApi = {
  workspace: {
    openDirectory: () => ipcRenderer.invoke(ipcChannels.workspace.openDirectory),
    getFileTree: (rootDir) => ipcRenderer.invoke(ipcChannels.workspace.getFileTree, rootDir)
  },
  file: {
    read: (request) => ipcRenderer.invoke(ipcChannels.file.read, request),
    write: (request) => ipcRenderer.invoke(ipcChannels.file.write, request),
    create: (request) => ipcRenderer.invoke(ipcChannels.file.create, request),
    createDirectory: (request) => ipcRenderer.invoke(ipcChannels.file.createDirectory, request),
    delete: (request) => ipcRenderer.invoke(ipcChannels.file.delete, request),
    rename: (request) => ipcRenderer.invoke(ipcChannels.file.rename, request)
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
    getContent: (request) => ipcRenderer.invoke(ipcChannels.keyword.getContent, request)
  }
};
