import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { PapersApi } from '@tnet/app-papers/shared/ipc';

export type PapersTnetApi = TnetApi & PapersApi;

const getPapersApi = (): PapersTnetApi => getTnetApi<PapersTnetApi>();

export const papersTnetApi: PapersTnetApi = {
  workspace: {
    openDirectory: () => getPapersApi().workspace.openDirectory(),
    getFileTree: (rootDir) => getPapersApi().workspace.getFileTree(rootDir)
  },
  file: {
    read: (request) => getPapersApi().file.read(request),
    openWithDefaultApp: (request) => getPapersApi().file.openWithDefaultApp(request),
    createDirectory: (request) => getPapersApi().file.createDirectory(request),
    rename: (request) => getPapersApi().file.rename(request),
    move: (request) => getPapersApi().file.move(request)
  },
  session: {
    load: (rootDir) => getPapersApi().session.load(rootDir),
    save: (rootDir, session) => getPapersApi().session.save(rootDir, session)
  },
  config: {
    loadGlobal: () => getPapersApi().config.loadGlobal(),
    saveGlobal: (config) => getPapersApi().config.saveGlobal(config)
  },
  papers: {
    config: {
      loadGlobal: () => getPapersApi().papers.config.loadGlobal(),
      saveGlobal: (config) => getPapersApi().papers.config.saveGlobal(config),
      loadLibrary: (libraryRoot) => getPapersApi().papers.config.loadLibrary(libraryRoot),
      saveLibrary: (libraryRoot, config) =>
        getPapersApi().papers.config.saveLibrary(libraryRoot, config)
    },
    library: {
      selectPdf: (request) => getPapersApi().papers.library.selectPdf(request),
      createPaperFromPdf: (request) => getPapersApi().papers.library.createPaperFromPdf(request),
      createPaperFromPdfBytes: (request) =>
        getPapersApi().papers.library.createPaperFromPdfBytes(request),
      importPdf: (request) => getPapersApi().papers.library.importPdf(request)
    },
    papers: {
      list: (request) => getPapersApi().papers.papers.list(request),
      get: (request) => getPapersApi().papers.papers.get(request)
    },
    tags: {
      list: (request) => getPapersApi().papers.tags.list(request),
      upsert: (request) => getPapersApi().papers.tags.upsert(request),
      attach: (request) => getPapersApi().papers.tags.attach(request),
      detach: (request) => getPapersApi().papers.tags.detach(request)
    },
    notes: {
      save: (request) => getPapersApi().papers.notes.save(request)
    },
    pdf: {
      loadBytes: (request) => getPapersApi().papers.pdf.loadBytes(request),
      openExternal: (request) => getPapersApi().papers.pdf.openExternal(request)
    },
    ai: {
      translatePdf: (request) => getPapersApi().papers.ai.translatePdf(request),
      translateText: (request) => getPapersApi().papers.ai.translateText(request),
      summarizePdf: (request) => getPapersApi().papers.ai.summarizePdf(request),
      summarizeText: (request) => getPapersApi().papers.ai.summarizeText(request)
    }
  }
};
