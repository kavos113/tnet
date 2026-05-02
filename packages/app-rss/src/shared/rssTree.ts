import type {
  RssFeed,
  RssFolder,
  RssTreeFeedNode,
  RssTreeFolderNode,
  RssTreeSnapshot
} from './rssTypes';

export const buildRssTree = (folders: RssFolder[], feeds: RssFeed[]): RssTreeSnapshot => {
  const folderNodes = new Map<string, RssTreeFolderNode>();
  [...folders].sort(compareByOrderThenName).forEach((folder) => {
    folderNodes.set(folder.id, {
      kind: 'folder',
      id: folder.id,
      name: folder.name,
      folders: [],
      feeds: []
    });
  });

  const rootFolders: RssTreeFolderNode[] = [];
  folders.forEach((folder) => {
    const node = folderNodes.get(folder.id);
    if (!node) return;
    const parent = folder.parentId ? folderNodes.get(folder.parentId) : undefined;
    if (parent) parent.folders.push(node);
    else rootFolders.push(node);
  });

  const rootFeeds: RssTreeFeedNode[] = [];
  [...feeds].sort(compareByOrderThenTitle).forEach((feed) => {
    const node = {
      kind: 'feed' as const,
      id: feed.id,
      title: feed.title,
      unreadCount: feed.unreadCount,
      lastSyncedAt: feed.lastSyncedAt,
      lastSyncError: feed.lastSyncError
    };
    const parent = feed.folderId ? folderNodes.get(feed.folderId) : undefined;
    if (parent) parent.feeds.push(node);
    else rootFeeds.push(node);
  });

  return { folders: rootFolders, feeds: rootFeeds };
};

const compareByOrderThenName = (a: RssFolder, b: RssFolder): number =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

const compareByOrderThenTitle = (a: RssFeed, b: RssFeed): number =>
  a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
