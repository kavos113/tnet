import { ipcRenderer } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import { markdownIpcChannels, type MarkdownApi } from '@tnet/app-markdown/shared/ipc';

export type DesktopTnetApi = TnetApi & MarkdownApi;

export const tnetApi: DesktopTnetApi = {
  workspace: {
    openDirectory: () => ipcRenderer.invoke(ipcChannels.workspace.openDirectory),
    getFileTree: (rootDir) => ipcRenderer.invoke(ipcChannels.workspace.getFileTree, rootDir)
  },
  file: {
    read: (request) => ipcRenderer.invoke(ipcChannels.file.read, request),
    openWithDefaultApp: (request) =>
      ipcRenderer.invoke(ipcChannels.file.openWithDefaultApp, request),
    write: (request) => ipcRenderer.invoke(ipcChannels.file.write, request),
    saveImage: (request) => ipcRenderer.invoke(ipcChannels.file.saveImage, request),
    readImage: (request) => ipcRenderer.invoke(ipcChannels.file.readImage, request),
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
    saveGlobal: (config) => ipcRenderer.invoke(ipcChannels.config.saveGlobal, config)
  },
  markdown: {
    config: {
      loadProject: (rootDir) => ipcRenderer.invoke(markdownIpcChannels.config.loadProject, rootDir),
      saveProject: (rootDir, config) =>
        ipcRenderer.invoke(markdownIpcChannels.config.saveProject, rootDir, config)
    }
  },
  keyword: {
    loadIndex: (rootDir) => ipcRenderer.invoke(ipcChannels.keyword.loadIndex, rootDir),
    getContent: (request) => ipcRenderer.invoke(ipcChannels.keyword.getContent, request)
  },
  search: {
    rebuild: (rootDir) => ipcRenderer.invoke(ipcChannels.search.rebuild, rootDir),
    workspace: (request) => ipcRenderer.invoke(ipcChannels.search.workspace, request)
  },
  llm: {
    getInlineCompletion: (request) =>
      ipcRenderer.invoke(ipcChannels.llm.getInlineCompletion, request)
  }
};
