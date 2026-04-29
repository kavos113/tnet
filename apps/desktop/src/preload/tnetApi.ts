import { ipcRenderer } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import { markdownIpcChannels, type MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import { papersIpcChannels, type PapersApi } from '@tnet/app-papers/shared/ipc';

export type DesktopTnetApi = TnetApi & MarkdownApi & PapersApi;

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
      importPdf: (request) => ipcRenderer.invoke(papersIpcChannels.library.importPdf, request)
    },
    papers: {
      list: (request) => ipcRenderer.invoke(papersIpcChannels.papers.list, request),
      get: (request) => ipcRenderer.invoke(papersIpcChannels.papers.get, request)
    },
    pdf: {
      loadBytes: (request) => ipcRenderer.invoke(papersIpcChannels.pdf.loadBytes, request),
      openExternal: (request) => ipcRenderer.invoke(papersIpcChannels.pdf.openExternal, request)
    }
  }
};
