import { ipcRenderer } from 'electron';
import { ipcChannels } from '@tnet/shared/ipc/channels';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import { markdownIpcChannels, type MarkdownApi } from '@tnet/app-markdown/shared/ipc';
import { papersIpcChannels, type PapersApi } from '@tnet/app-papers/shared/ipc';
import { requesterIpcChannels, type RequesterApi } from '@tnet/app-requester/shared/ipc';
import { dbInspectorIpcChannels, type DbInspectorApi } from '@tnet/app-db-inspector/shared/ipc';
import { tasksIpcChannels, type TasksApi } from '@tnet/app-tasks/shared/ipc';
import { pdfViewerIpcChannels, type PdfViewerApi } from '@tnet/app-pdf-viewer/shared/ipc';

export type DesktopTnetApi = TnetApi &
  MarkdownApi &
  PapersApi &
  RequesterApi &
  DbInspectorApi &
  TasksApi &
  PdfViewerApi;

export const tnetApi: DesktopTnetApi = {
  workspace: {
    openDirectory: () => ipcRenderer.invoke(ipcChannels.workspace.openDirectory),
    getFileTree: (rootDir) => ipcRenderer.invoke(ipcChannels.workspace.getFileTree, rootDir)
  },
  file: {
    read: (request) => ipcRenderer.invoke(ipcChannels.file.read, request),
    openWithDefaultApp: (request) =>
      ipcRenderer.invoke(ipcChannels.file.openWithDefaultApp, request),
    createDirectory: (request) => ipcRenderer.invoke(ipcChannels.file.createDirectory, request),
    rename: (request) => ipcRenderer.invoke(ipcChannels.file.rename, request),
    move: (request) => ipcRenderer.invoke(ipcChannels.file.move, request)
  },
  session: {
    load: (rootDir) => ipcRenderer.invoke(ipcChannels.session.load, rootDir),
    save: (rootDir, session) => ipcRenderer.invoke(ipcChannels.session.save, rootDir, session)
  },
  config: {
    loadGlobal: () => ipcRenderer.invoke(ipcChannels.config.loadGlobal),
    saveGlobal: (config) => ipcRenderer.invoke(ipcChannels.config.saveGlobal, config)
  },
  tasks: {
    config: {
      loadGlobal: () => ipcRenderer.invoke(tasksIpcChannels.config.loadGlobal),
      saveGlobal: (config) => ipcRenderer.invoke(tasksIpcChannels.config.saveGlobal, config)
    },
    tasks: {
      list: (request) => ipcRenderer.invoke(tasksIpcChannels.tasks.list, request),
      save: (request) => ipcRenderer.invoke(tasksIpcChannels.tasks.save, request),
      complete: (request) => ipcRenderer.invoke(tasksIpcChannels.tasks.complete, request),
      remove: (request) => ipcRenderer.invoke(tasksIpcChannels.tasks.remove, request)
    },
    categories: {
      list: () => ipcRenderer.invoke(tasksIpcChannels.categories.list)
    },
    calendarSources: {
      list: () => ipcRenderer.invoke(tasksIpcChannels.calendarSources.list),
      save: (request) => ipcRenderer.invoke(tasksIpcChannels.calendarSources.save, request),
      remove: (request) => ipcRenderer.invoke(tasksIpcChannels.calendarSources.remove, request),
      authorizeGoogle: (request) =>
        ipcRenderer.invoke(tasksIpcChannels.calendarSources.authorizeGoogle, request)
    },
    calendarOccurrences: {
      list: (request) => ipcRenderer.invoke(tasksIpcChannels.calendarOccurrences.list, request)
    },
    subscribedTaskOccurrences: {
      list: (request) =>
        ipcRenderer.invoke(tasksIpcChannels.subscribedTaskOccurrences.list, request),
      complete: (request) =>
        ipcRenderer.invoke(tasksIpcChannels.subscribedTaskOccurrences.complete, request)
    },
    localEvents: {
      list: (request) => ipcRenderer.invoke(tasksIpcChannels.localEvents.list, request),
      save: (request) => ipcRenderer.invoke(tasksIpcChannels.localEvents.save, request),
      remove: (request) => ipcRenderer.invoke(tasksIpcChannels.localEvents.remove, request)
    },
    sync: {
      manual: (request) => ipcRenderer.invoke(tasksIpcChannels.sync.manual, request)
    },
    secrets: {
      has: (request) => ipcRenderer.invoke(tasksIpcChannels.secrets.has, request)
    }
  },
  pdfViewer: {
    config: {
      loadGlobal: () => ipcRenderer.invoke(pdfViewerIpcChannels.config.loadGlobal),
      saveGlobal: (config) => ipcRenderer.invoke(pdfViewerIpcChannels.config.saveGlobal, config)
    },
    pdf: {
      loadBytes: (request) => ipcRenderer.invoke(pdfViewerIpcChannels.pdf.loadBytes, request),
      openExternal: (request) => ipcRenderer.invoke(pdfViewerIpcChannels.pdf.openExternal, request)
    }
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
    },
    ai: {
      translatePdf: (request) => ipcRenderer.invoke(papersIpcChannels.ai.translatePdf, request),
      translateText: (request) => ipcRenderer.invoke(papersIpcChannels.ai.translateText, request),
      summarizePdf: (request) => ipcRenderer.invoke(papersIpcChannels.ai.summarizePdf, request),
      summarizeText: (request) => ipcRenderer.invoke(papersIpcChannels.ai.summarizeText, request),
      onStreamEvent: (listener) => {
        const handler = (_event, streamEvent): void => listener(streamEvent);
        ipcRenderer.on(papersIpcChannels.ai.streamEvent, handler);
        return () => ipcRenderer.off(papersIpcChannels.ai.streamEvent, handler);
      }
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
      list: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.list, request),
      get: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.get, request),
      save: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.save, request),
      duplicate: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.duplicate, request),
      rename: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.rename, request),
      reorder: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.reorder, request),
      remove: (request) => ipcRenderer.invoke(requesterIpcChannels.requests.remove, request)
    },
    variableSets: {
      list: (request) => ipcRenderer.invoke(requesterIpcChannels.variableSets.list, request),
      save: (request) => ipcRenderer.invoke(requesterIpcChannels.variableSets.save, request),
      remove: (request) => ipcRenderer.invoke(requesterIpcChannels.variableSets.remove, request),
      setActive: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.variableSets.setActive, request),
      listVariables: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.variableSets.listVariables, request)
    },
    execution: {
      send: (request) => ipcRenderer.invoke(requesterIpcChannels.execution.send, request),
      abort: (request) => ipcRenderer.invoke(requesterIpcChannels.execution.abort, request)
    },
    history: {
      list: (request) => ipcRenderer.invoke(requesterIpcChannels.history.list, request),
      get: (request) => ipcRenderer.invoke(requesterIpcChannels.history.get, request),
      remove: (request) => ipcRenderer.invoke(requesterIpcChannels.history.remove, request),
      clear: (request) => ipcRenderer.invoke(requesterIpcChannels.history.clear, request)
    },
    cookies: {
      list: (request) => ipcRenderer.invoke(requesterIpcChannels.cookies.list, request),
      remove: (request) => ipcRenderer.invoke(requesterIpcChannels.cookies.remove, request),
      clear: (request) => ipcRenderer.invoke(requesterIpcChannels.cookies.clear, request)
    },
    secrets: {
      save: (request) => ipcRenderer.invoke(requesterIpcChannels.secrets.save, request),
      has: (request) => ipcRenderer.invoke(requesterIpcChannels.secrets.has, request)
    },
    files: {
      selectBinaryBody: () => ipcRenderer.invoke(requesterIpcChannels.files.selectBinaryBody),
      selectGrpcProto: () => ipcRenderer.invoke(requesterIpcChannels.files.selectGrpcProto),
      saveResponseBody: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.files.saveResponseBody, request),
      openResponseExternally: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.files.openResponseExternally, request)
    },
    graphql: {
      introspect: (request) => ipcRenderer.invoke(requesterIpcChannels.graphql.introspect, request)
    },
    backup: {
      exportWorkspace: (request) =>
        ipcRenderer.invoke(requesterIpcChannels.backup.exportWorkspace, request),
      importWorkspace: () => ipcRenderer.invoke(requesterIpcChannels.backup.importWorkspace)
    }
  },
  dbInspector: {
    config: {
      loadGlobal: () => ipcRenderer.invoke(dbInspectorIpcChannels.config.loadGlobal),
      saveGlobal: (config) => ipcRenderer.invoke(dbInspectorIpcChannels.config.saveGlobal, config)
    },
    workspaces: {
      list: () => ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.list),
      create: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.create, request),
      update: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.update, request),
      remove: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.remove, request),
      getSettings: (request) =>
        ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.getSettings, request),
      saveSettings: (request) =>
        ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.saveSettings, request),
      testConnection: (request) =>
        ipcRenderer.invoke(dbInspectorIpcChannels.workspaces.testConnection, request)
    },
    schema: {
      refresh: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.schema.refresh, request),
      getTree: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.schema.getTree, request)
    },
    tableData: {
      loadPage: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.tableData.loadPage, request)
    },
    query: {
      execute: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.query.execute, request),
      explain: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.query.explain, request),
      listHistory: (request) =>
        ipcRenderer.invoke(dbInspectorIpcChannels.query.listHistory, request),
      listTabs: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.query.listTabs, request),
      saveTab: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.query.saveTab, request),
      closeTab: (request) => ipcRenderer.invoke(dbInspectorIpcChannels.query.closeTab, request)
    },
    files: {
      selectSqliteDatabase: () =>
        ipcRenderer.invoke(dbInspectorIpcChannels.files.selectSqliteDatabase),
      saveTextFile: (request) =>
        ipcRenderer.invoke(dbInspectorIpcChannels.files.saveTextFile, request),
      saveBinaryFile: (request) =>
        ipcRenderer.invoke(dbInspectorIpcChannels.files.saveBinaryFile, request)
    }
  }
};
