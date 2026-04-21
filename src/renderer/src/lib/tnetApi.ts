import type { TnetApi } from '@shared/ipc/contracts';

const getApi = (): TnetApi => {
  if (typeof window !== 'undefined' && window.tnet) return window.tnet;
  throw new Error('window.tnet is not available');
};

export const tnetApi: TnetApi = {
  workspace: {
    openDirectory: () => getApi().workspace.openDirectory(),
    getFileTree: (dirPath) => getApi().workspace.getFileTree(dirPath)
  },
  file: {
    read: (filePath) => getApi().file.read(filePath),
    write: (filePath, content, rootDir) => getApi().file.write(filePath, content, rootDir),
    create: (filePath) => getApi().file.create(filePath),
    createDirectory: (dirPath) => getApi().file.createDirectory(dirPath),
    delete: (filePath, rootDir) => getApi().file.delete(filePath, rootDir),
    rename: (oldPath, newPath, rootDir) => getApi().file.rename(oldPath, newPath, rootDir)
  },
  session: {
    load: (rootDir) => getApi().session.load(rootDir),
    save: (rootDir, session) => getApi().session.save(rootDir, session)
  },
  config: {
    loadGlobal: () => getApi().config.loadGlobal(),
    saveGlobal: (config) => getApi().config.saveGlobal(config),
    loadProject: (rootDir) => getApi().config.loadProject(rootDir),
    saveProject: (rootDir, config) => getApi().config.saveProject(rootDir, config)
  },
  keyword: {
    loadIndex: (rootDir) => getApi().keyword.loadIndex(rootDir),
    getContent: (filePath, name) => getApi().keyword.getContent(filePath, name)
  }
};
