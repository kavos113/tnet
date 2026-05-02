import { ipcMain } from 'electron';
import type { RssGlobalConfig } from '@tnet/app-rss/shared/config';
import { rssIpcChannels } from '@tnet/app-rss/shared/ipc';
import { buildRssTree } from '@tnet/app-rss/shared/rssTree';
import { loadRssGlobalConfig, saveRssGlobalConfig } from './rssConfigService';
import {
  openRssDatabase,
  RssFeedRepository,
  RssFolderRepository,
  RssItemRepository
} from './repository';
import { FeedFetchService } from './service/feedFetchService';
import { FeedSyncService } from './service/feedSyncService';

export interface RegisterRssIpcOptions {
  userDataDir: string;
}

export const registerRssIpc = ({ userDataDir }: RegisterRssIpcOptions): void => {
  const database = openRssDatabase(userDataDir);
  const folderRepository = new RssFolderRepository(database);
  const feedRepository = new RssFeedRepository(database);
  const itemRepository = new RssItemRepository(database);

  ipcMain.handle(rssIpcChannels.config.loadGlobal, async () => loadRssGlobalConfig(userDataDir));
  ipcMain.handle(rssIpcChannels.config.saveGlobal, async (_event, config: RssGlobalConfig) =>
    saveRssGlobalConfig(userDataDir, config)
  );

  ipcMain.handle(rssIpcChannels.folders.list, async () => folderRepository.list());
  ipcMain.handle(rssIpcChannels.folders.listTree, async () =>
    buildRssTree(folderRepository.list(), feedRepository.list())
  );
  ipcMain.handle(rssIpcChannels.folders.create, async (_event, request) =>
    folderRepository.create(request)
  );
  ipcMain.handle(rssIpcChannels.folders.rename, async (_event, request) =>
    folderRepository.rename(request)
  );
  ipcMain.handle(rssIpcChannels.folders.move, async (_event, request) =>
    folderRepository.move(request)
  );
  ipcMain.handle(rssIpcChannels.folders.remove, async (_event, request) => {
    folderRepository.remove(request.folderId);
  });

  ipcMain.handle(rssIpcChannels.feeds.list, async () => feedRepository.list());
  ipcMain.handle(rssIpcChannels.feeds.create, async (_event, request) =>
    feedRepository.create(request)
  );
  ipcMain.handle(rssIpcChannels.feeds.update, async (_event, request) =>
    feedRepository.update(request)
  );
  ipcMain.handle(rssIpcChannels.feeds.move, async (_event, request) =>
    feedRepository.move(request)
  );
  ipcMain.handle(rssIpcChannels.feeds.remove, async (_event, request) => {
    feedRepository.remove(request.feedId);
  });
  ipcMain.handle(rssIpcChannels.feeds.sync, async (_event, request) => {
    const config = await loadRssGlobalConfig(userDataDir);
    const syncService = new FeedSyncService(
      feedRepository,
      itemRepository,
      new FeedFetchService({
        timeoutSeconds: config.settings.fetchTimeoutSeconds
      })
    );
    return syncService.sync(request?.feedId);
  });

  ipcMain.handle(rssIpcChannels.items.list, async (_event, request) =>
    itemRepository.list(request)
  );
  ipcMain.handle(rssIpcChannels.items.get, async (_event, request) =>
    itemRepository.get(request.itemId)
  );
  ipcMain.handle(rssIpcChannels.items.markRead, async (_event, request) =>
    itemRepository.markRead(request.itemId, true)
  );
  ipcMain.handle(rssIpcChannels.items.markUnread, async (_event, request) =>
    itemRepository.markRead(request.itemId, false)
  );
  ipcMain.handle(rssIpcChannels.items.markAllRead, async (_event, request) => {
    itemRepository.markAllRead(request?.feedId);
  });
  ipcMain.handle(rssIpcChannels.items.setStarred, async (_event, request) =>
    itemRepository.setStarred(request.itemId, request.starred)
  );
  ipcMain.handle(rssIpcChannels.items.archive, async (_event, request) =>
    itemRepository.archive(request.itemId, request.archived)
  );
};
