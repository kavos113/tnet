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
    createDirectory: (request) => getPapersApi().file.createDirectory(request)
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
      importPdf: (request) => getPapersApi().papers.library.importPdf(request)
    },
    papers: {
      list: (request) => getPapersApi().papers.papers.list(request),
      get: (request) => getPapersApi().papers.papers.get(request)
    },
    pdf: {
      loadBytes: (request) => getPapersApi().papers.pdf.loadBytes(request),
      openExternal: (request) => getPapersApi().papers.pdf.openExternal(request)
    }
  }
};
