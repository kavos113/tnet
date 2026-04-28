import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { MarkdownApi } from '@tnet/app-markdown/shared/ipc';

export type MarkdownTnetApi = TnetApi & MarkdownApi;

const getMarkdownApi = (): MarkdownTnetApi => getTnetApi<MarkdownTnetApi>();

export const markdownTnetApi: MarkdownTnetApi = {
  workspace: {
    openDirectory: () => getMarkdownApi().workspace.openDirectory(),
    getFileTree: (rootDir) => getMarkdownApi().workspace.getFileTree(rootDir)
  },
  file: {
    read: (request) => getMarkdownApi().file.read(request),
    openWithDefaultApp: (request) => getMarkdownApi().file.openWithDefaultApp(request),
    write: (request) => getMarkdownApi().file.write(request),
    saveImage: (request) => getMarkdownApi().file.saveImage(request),
    readImage: (request) => getMarkdownApi().file.readImage(request),
    create: (request) => getMarkdownApi().file.create(request),
    createDirectory: (request) => getMarkdownApi().file.createDirectory(request),
    delete: (request) => getMarkdownApi().file.delete(request),
    rename: (request) => getMarkdownApi().file.rename(request)
  },
  session: {
    load: (rootDir) => getMarkdownApi().session.load(rootDir),
    save: (rootDir, session) => getMarkdownApi().session.save(rootDir, session)
  },
  config: {
    loadGlobal: () => getMarkdownApi().config.loadGlobal(),
    saveGlobal: (config) => getMarkdownApi().config.saveGlobal(config)
  },
  keyword: {
    loadIndex: (rootDir) => getMarkdownApi().keyword.loadIndex(rootDir),
    getContent: (request) => getMarkdownApi().keyword.getContent(request)
  },
  search: {
    rebuild: (rootDir) => getMarkdownApi().search.rebuild(rootDir),
    workspace: (request) => getMarkdownApi().search.workspace(request)
  },
  llm: {
    getInlineCompletion: (request) => getMarkdownApi().llm.getInlineCompletion(request)
  },
  markdown: {
    config: {
      loadProject: (rootDir) => getMarkdownApi().markdown.config.loadProject(rootDir),
      saveProject: (rootDir, config) =>
        getMarkdownApi().markdown.config.saveProject(rootDir, config)
    }
  }
};
