import type { RssGlobalConfig } from './config';
import type {
  CreateRssFeedInput,
  CreateRssFolderInput,
  DiscoverRssFeedsRequest,
  ImportLocalRssFeedInput,
  ListRssItemsRequest,
  ListRssItemsResult,
  MoveRssFeedInput,
  MoveRssFolderInput,
  RenameRssFolderInput,
  RssFeed,
  RssFolder,
  RssItem,
  RssSyncResult,
  RssTreeSnapshot,
  UpdateRssFeedInput
} from './rssTypes';

export const rssIpcChannels = {
  config: {
    loadGlobal: 'rss:config:loadGlobal',
    saveGlobal: 'rss:config:saveGlobal'
  },
  folders: {
    list: 'rss:folders:list',
    listTree: 'rss:folders:listTree',
    create: 'rss:folders:create',
    rename: 'rss:folders:rename',
    move: 'rss:folders:move',
    remove: 'rss:folders:remove'
  },
  feeds: {
    list: 'rss:feeds:list',
    listBasic: 'rss:feeds:listBasic',
    create: 'rss:feeds:create',
    update: 'rss:feeds:update',
    importLocalXml: 'rss:feeds:importLocalXml',
    discover: 'rss:feeds:discover',
    move: 'rss:feeds:move',
    remove: 'rss:feeds:remove',
    sync: 'rss:feeds:sync'
  },
  opml: {
    importText: 'rss:opml:importText',
    exportText: 'rss:opml:exportText'
  },
  items: {
    list: 'rss:items:list',
    get: 'rss:items:get',
    markRead: 'rss:items:markRead',
    markUnread: 'rss:items:markUnread',
    markAllRead: 'rss:items:markAllRead',
    setStarred: 'rss:items:setStarred',
    archive: 'rss:items:archive'
  }
} as const;

export interface RssApi {
  rss: {
    config: {
      loadGlobal: () => Promise<RssGlobalConfig>;
      saveGlobal: (config: RssGlobalConfig) => Promise<void>;
    };
    folders: {
      list: () => Promise<RssFolder[]>;
      listTree: () => Promise<RssTreeSnapshot>;
      create: (request: CreateRssFolderInput) => Promise<RssFolder>;
      rename: (request: RenameRssFolderInput) => Promise<RssFolder>;
      move: (request: MoveRssFolderInput) => Promise<RssFolder>;
      remove: (request: { folderId: string }) => Promise<void>;
    };
    feeds: {
      list: () => Promise<RssFeed[]>;
      listBasic: () => Promise<RssFeed[]>;
      create: (request: CreateRssFeedInput) => Promise<RssFeed>;
      update: (request: UpdateRssFeedInput) => Promise<RssFeed>;
      importLocalXml: (request: ImportLocalRssFeedInput) => Promise<RssFeed>;
      discover: (
        request: DiscoverRssFeedsRequest
      ) => Promise<Array<{ title?: string; url: string }>>;
      move: (request: MoveRssFeedInput) => Promise<RssFeed>;
      remove: (request: { feedId: string }) => Promise<void>;
      sync: (request?: { feedId?: string }) => Promise<RssSyncResult>;
    };
    opml: {
      importText: (request: { opml: string; folderId?: string }) => Promise<RssFeed[]>;
      exportText: () => Promise<string>;
    };
    items: {
      list: (request?: ListRssItemsRequest) => Promise<ListRssItemsResult>;
      get: (request: { itemId: string }) => Promise<RssItem | null>;
      markRead: (request: { itemId: string }) => Promise<RssItem>;
      markUnread: (request: { itemId: string }) => Promise<RssItem>;
      markAllRead: (request?: { feedId?: string }) => Promise<void>;
      setStarred: (request: { itemId: string; starred: boolean }) => Promise<RssItem>;
      archive: (request: { itemId: string; archived: boolean }) => Promise<RssItem>;
    };
  };
}
