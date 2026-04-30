import { ipcRenderer } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import { markdownIpcChannels, type MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import { papersIpcChannels, type PapersApi } from '@tnet/app-papers/shared/ipc';
import { requesterIpcChannels, type RequesterApi } from '@tnet/app-requester/shared/ipc';

export type DesktopTnetApi = TnetApi & MarkdownApi & PapersApi & RequesterApi;

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
  },
  papers: {
    config: {
      loadGlobal: () => ipcRenderer.invoke(papersIpcChannels.config.loadGlobal),
      saveGlobal: (config) => ipcRenderer.invoke(papersIpcChannels.config.saveGlobal, config),
      loadLibrary: (libraryRoot) =>
        ipcRenderer.invoke(papersIpcChannels.config.loadLibrary, libraryRoot),
      saveLibrary: (libraryRoot, config) =>
        ipcRenderer.invoke(papersIpcChannels.config.saveLibrary, libraryRoot, config)
    },
    library: {
      selectPdf: (request) => ipcRenderer.invoke(papersIpcChannels.library.selectPdf, request),
      createPaperFromPdf: (request) =>
        ipcRenderer.invoke(papersIpcChannels.library.createPaperFromPdf, request),
      createPaperFromPdfBytes: (request) =>
        ipcRenderer.invoke(papersIpcChannels.library.createPaperFromPdfBytes, request),
      importPdf: (request) => ipcRenderer.invoke(papersIpcChannels.library.importPdf, request)
    },
    papers: {
      list: (request) => ipcRenderer.invoke(papersIpcChannels.papers.list, request),
      get: (request) => ipcRenderer.invoke(papersIpcChannels.papers.get, request)
    },
    tags: {
      list: (request) => ipcRenderer.invoke(papersIpcChannels.tags.list, request),
      upsert: (request) => ipcRenderer.invoke(papersIpcChannels.tags.upsert, request),
      attach: (request) => ipcRenderer.invoke(papersIpcChannels.tags.attach, request),
      detach: (request) => ipcRenderer.invoke(papersIpcChannels.tags.detach, request)
    },
    notes: {
      save: (request) => ipcRenderer.invoke(papersIpcChannels.notes.save, request)
    },
    pdf: {
      loadBytes: (request) => ipcRenderer.invoke(papersIpcChannels.pdf.loadBytes, request),
      openExternal: (request) => ipcRenderer.invoke(papersIpcChannels.pdf.openExternal, request)
    }
  },
  requester: {
    config: {
      loadGlobal: () => ipcRenderer.invoke(requesterIpcChannels.config.loadGlobal),
      saveGlobal: (config) => ipcRenderer.invoke(requesterIpcChannels.config.saveGlobal, config)
    },
    workspaces: {
      list: () => ipcRenderer.invoke(requesterIpcChannels.workspaces.list),
      create: (request) => ipcRenderer.invoke(requesterIpcChannels.workspaces.create, request),
      update: (request) => ipcRenderer.invoke(requesterIpcChannels.workspaces.update, request),
      remove: (request) => ipcRenderer.invoke(requesterIpcChannels.workspaces.remove, request),
      getSettings: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.workspaces.getSettings, request),
      saveSettings: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.workspaces.saveSettings, request)
    },
    requests: {
      list: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.list, request)
    }
  }
};
