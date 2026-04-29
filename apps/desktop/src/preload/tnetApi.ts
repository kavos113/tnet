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
    createDirectory: (request) => ipcRenderer.invoke(ipcChannels.file.createDirectory, request)
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
    },
    file: {
      write: (request) => ipcRenderer.invoke(markdownIpcChannels.file.write, request),
      saveImage: (request) => ipcRenderer.invoke(markdownIpcChannels.file.saveImage, request),
      readImage: (request) => ipcRenderer.invoke(markdownIpcChannels.file.readImage, request),
      create: (request) => ipcRenderer.invoke(markdownIpcChannels.file.create, request),
      delete: (request) => ipcRenderer.invoke(markdownIpcChannels.file.delete, request),
      rename: (request) => ipcRenderer.invoke(markdownIpcChannels.file.rename, request)
    },
    keyword: {
      loadIndex: (rootDir) => ipcRenderer.invoke(markdownIpcChannels.keyword.loadIndex, rootDir),
      getContent: (request) => ipcRenderer.invoke(markdownIpcChannels.keyword.getContent, request)
    },
    search: {
      rebuild: (rootDir) => ipcRenderer.invoke(markdownIpcChannels.search.rebuild, rootDir),
      workspace: (request) => ipcRenderer.invoke(markdownIpcChannels.search.workspace, request)
    },
    llm: {
      getInlineCompletion: (request) =>
        ipcRenderer.invoke(markdownIpcChannels.llm.getInlineCompletion, request)
    }
  }
};
