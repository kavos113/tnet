import type { TnetApi } from '@tnet/shared/ipc/contracts';

export const getTnetApi = <TApi extends TnetApi = TnetApi>(): TApi => {
  if (typeof window !== 'undefined' && window.tnet) return window.tnet as unknown as TApi;
  throw new Error('window.tnet is not available');
};

const getApi = getTnetApi;

export const tnetApi: TnetApi = {
  workspace: {
    openDirectory: () => getApi().workspace.openDirectory(),
    getFileTree: (rootDir) => getApi().workspace.getFileTree(rootDir)
  },
  file: {
    read: (request) => getApi().file.read(request),
    openWithDefaultApp: (request) => getApi().file.openWithDefaultApp(request),
    write: (request) => getApi().file.write(request),
    saveImage: (request) => getApi().file.saveImage(request),
    readImage: (request) => getApi().file.readImage(request),
    create: (request) => getApi().file.create(request),
    createDirectory: (request) => getApi().file.createDirectory(request),
    delete: (request) => getApi().file.delete(request),
    rename: (request) => getApi().file.rename(request)
  },
  session: {
    load: (rootDir) => getApi().session.load(rootDir),
    save: (rootDir, session) => getApi().session.save(rootDir, session)
  },
  config: {
    loadGlobal: () => getApi().config.loadGlobal(),
    saveGlobal: (config) => getApi().config.saveGlobal(config)
  },
  keyword: {
    loadIndex: (rootDir) => getApi().keyword.loadIndex(rootDir),
    getContent: (request) => getApi().keyword.getContent(request)
  },
  search: {
    rebuild: (rootDir) => getApi().search.rebuild(rootDir),
    workspace: (request) => getApi().search.workspace(request)
  },
  llm: {
    getInlineCompletion: (request) => getApi().llm.getInlineCompletion(request)
  }
};
