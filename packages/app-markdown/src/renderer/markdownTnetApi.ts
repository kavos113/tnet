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
    createDirectory: (request) => getMarkdownApi().file.createDirectory(request)
  },
  session: {
    load: (rootDir) => getMarkdownApi().session.load(rootDir),
    save: (rootDir, session) => getMarkdownApi().session.save(rootDir, session)
  },
  config: {
    loadGlobal: () => getMarkdownApi().config.loadGlobal(),
    saveGlobal: (config) => getMarkdownApi().config.saveGlobal(config)
  },
  markdown: {
    config: {
      loadProject: (rootDir) => getMarkdownApi().markdown.config.loadProject(rootDir),
      saveProject: (rootDir, config) =>
        getMarkdownApi().markdown.config.saveProject(rootDir, config)
    },
    file: {
      write: (request) => getMarkdownApi().markdown.file.write(request),
      saveImage: (request) => getMarkdownApi().markdown.file.saveImage(request),
      readImage: (request) => getMarkdownApi().markdown.file.readImage(request),
      create: (request) => getMarkdownApi().markdown.file.create(request),
      delete: (request) => getMarkdownApi().markdown.file.delete(request),
      rename: (request) => getMarkdownApi().markdown.file.rename(request)
    },
    keyword: {
      loadIndex: (rootDir) => getMarkdownApi().markdown.keyword.loadIndex(rootDir),
      getContent: (request) => getMarkdownApi().markdown.keyword.getContent(request)
    },
    search: {
      rebuild: (rootDir) => getMarkdownApi().markdown.search.rebuild(rootDir),
      workspace: (request) => getMarkdownApi().markdown.search.workspace(request)
    },
    llm: {
      getInlineCompletion: (request) => getMarkdownApi().markdown.llm.getInlineCompletion(request)
    }
  }
};
