import type { FileItem } from '@tnet/shared/types/file';
import type { RssTreeFeedNode, RssTreeFolderNode } from '@tnet/app-rss/shared/rssTypes';

const rssFeedPathPrefix = 'rss-feed:';

export const toRssTreeFileItems = (
  folders: RssTreeFolderNode[],
  feeds: RssTreeFeedNode[]
): FileItem[] => [...folders.map(toFolderItem), ...feeds.map(toFeedItem)];

export const feedPath = (feedId: string): string => `${rssFeedPathPrefix}${feedId}`;

export const feedIdFromPath = (path: string): string | undefined =>
  path.startsWith(rssFeedPathPrefix) ? path.slice(rssFeedPathPrefix.length) : undefined;

const toFolderItem = (folder: RssTreeFolderNode): FileItem => ({
  name: folder.name,
  path: folder.id,
  isDirectory: true,
  children: toRssTreeFileItems(folder.folders, folder.feeds)
});

const toFeedItem = (feed: RssTreeFeedNode): FileItem => ({
  name: feed.unreadCount > 0 ? `${feed.title} (${feed.unreadCount})` : feed.title,
  path: feedPath(feed.id),
  isDirectory: false
});
