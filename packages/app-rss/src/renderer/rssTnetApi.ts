import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import type { RssApi } from '@tnet/app-rss/shared/ipc';

const getApi = (): TnetApi & RssApi => getTnetApi<TnetApi & RssApi>();

export const rssTnetApi: RssApi = {
  rss: {
    config: {
      loadGlobal: () => getApi().rss.config.loadGlobal(),
      saveGlobal: (config) => getApi().rss.config.saveGlobal(config)
    },
    folders: {
      list: () => getApi().rss.folders.list(),
      listTree: () => getApi().rss.folders.listTree(),
      create: (request) => getApi().rss.folders.create(request),
      rename: (request) => getApi().rss.folders.rename(request),
      move: (request) => getApi().rss.folders.move(request),
      remove: (request) => getApi().rss.folders.remove(request)
    },
    feeds: {
      list: () => getApi().rss.feeds.list(),
      create: (request) => getApi().rss.feeds.create(request),
      update: (request) => getApi().rss.feeds.update(request),
      move: (request) => getApi().rss.feeds.move(request),
      remove: (request) => getApi().rss.feeds.remove(request),
      sync: (request) => getApi().rss.feeds.sync(request)
    },
    items: {
      list: (request) => getApi().rss.items.list(request),
      get: (request) => getApi().rss.items.get(request),
      markRead: (request) => getApi().rss.items.markRead(request),
      markUnread: (request) => getApi().rss.items.markUnread(request),
      markAllRead: (request) => getApi().rss.items.markAllRead(request),
      setStarred: (request) => getApi().rss.items.setStarred(request),
      archive: (request) => getApi().rss.items.archive(request)
    }
  }
};
