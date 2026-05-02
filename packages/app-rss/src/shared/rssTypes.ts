export type RssSystemView = 'all' | 'unread' | 'starred' | 'archived';

export interface RssFolder {
  id: string;
  parentId?: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RssFeed {
  id: string;
  folderId?: string;
  title: string;
  url: string;
  siteUrl?: string;
  description?: string;
  iconUrl?: string;
  sortOrder: number;
  enabled: boolean;
  lastSyncedAt?: string;
  lastSyncError?: string;
  etag?: string;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface RssItem {
  id: string;
  feedId: string;
  externalId: string;
  title: string;
  link?: string;
  author?: string;
  summary?: string;
  contentHtml?: string;
  publishedAt?: string;
  updatedAt?: string;
  readAt?: string;
  starred: boolean;
  archivedAt?: string;
  fetchedAt: string;
}

export interface RssTreeFolderNode {
  kind: 'folder';
  id: string;
  name: string;
  folders: RssTreeFolderNode[];
  feeds: RssTreeFeedNode[];
}

export interface RssTreeFeedNode {
  kind: 'feed';
  id: string;
  title: string;
  unreadCount: number;
  lastSyncError?: string;
}

export interface RssTreeSnapshot {
  folders: RssTreeFolderNode[];
  feeds: RssTreeFeedNode[];
}

export interface CreateRssFolderInput {
  parentId?: string;
  name: string;
}

export interface RenameRssFolderInput {
  folderId: string;
  name: string;
}

export interface MoveRssFolderInput {
  folderId: string;
  parentId?: string;
}

export interface CreateRssFeedInput {
  folderId?: string;
  title?: string;
  url: string;
}

export interface UpdateRssFeedInput {
  feedId: string;
  title?: string;
  url?: string;
  enabled?: boolean;
}

export interface MoveRssFeedInput {
  feedId: string;
  folderId?: string;
}

export interface ListRssItemsRequest {
  view?: RssSystemView;
  feedId?: string;
  folderId?: string;
  searchQuery?: string;
  limit?: number;
  cursor?: string;
}

export interface ListRssItemsResult {
  items: RssItem[];
  nextCursor?: string;
}

export interface RssSyncResult {
  feeds: RssFeed[];
  syncedFeedIds: string[];
  failedFeedIds: string[];
}
