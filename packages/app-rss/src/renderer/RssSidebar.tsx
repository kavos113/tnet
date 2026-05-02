import { rssTnetApi } from './rssTnetApi';
import {
  selectRssFeed,
  selectRssFolder,
  selectRssSystemView,
  setRssFeeds,
  setRssFolders,
  setRssSyncing,
  setRssTree
} from './rssSlice';
import { useRssDispatch, useRssSelector } from './storeHooks';
import type { RssTreeFolderNode } from '@tnet/app-rss/shared/rssTypes';
import styles from './RssSidebar.module.css';

export const RssSidebar = (): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const { tree, selectedView, selectedFeedId, selectedFolderId } = useRssSelector(
    (state) => state.rss
  );

  const createFolder = async (): Promise<void> => {
    const name = window.prompt('Folder name');
    if (!name) return;
    await rssTnetApi.rss.folders.create({ name });
    const [folders, nextTree] = await Promise.all([
      rssTnetApi.rss.folders.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFolders(folders));
    dispatch(setRssTree(nextTree));
  };

  const refreshTree = async (): Promise<void> => {
    const [folders, feeds, nextTree] = await Promise.all([
      rssTnetApi.rss.folders.list(),
      rssTnetApi.rss.feeds.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFolders(folders));
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(nextTree));
  };
  const handleDropOnRoot = async (event: React.DragEvent): Promise<void> => {
    event.preventDefault();
    const feedId = event.dataTransfer.getData('application/x-rss-feed-id');
    const folderId = event.dataTransfer.getData('application/x-rss-folder-id');
    if (feedId) await rssTnetApi.rss.feeds.move({ feedId });
    if (folderId) await rssTnetApi.rss.folders.move({ folderId });
    await refreshTree();
  };

  return (
    <aside className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>RSS Feeds</span>
        <button className={styles.button} type="button" onClick={() => createFolder()}>
          New Folder
        </button>
      </div>
      <div
        className={styles.tree}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDropOnRoot}
      >
        {(['all', 'unread', 'starred', 'archived'] as const).map((view) => (
          <button
            key={view}
            type="button"
            className={[
              styles.systemNode,
              selectedView === view && !selectedFeedId && !selectedFolderId ? styles.active : ''
            ].join(' ')}
            onClick={() => dispatch(selectRssSystemView(view))}
          >
            {viewLabel(view)}
          </button>
        ))}
        {tree.folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            activeFolderId={selectedFolderId}
            activeFeedId={selectedFeedId}
            onRefresh={refreshTree}
          />
        ))}
        {tree.feeds.map((feed) => (
          <FeedNode
            key={feed.id}
            feed={feed}
            activeFeedId={selectedFeedId}
            onRefresh={refreshTree}
          />
        ))}
      </div>
    </aside>
  );
};

const FolderNode = ({
  folder,
  activeFolderId,
  activeFeedId,
  onRefresh
}: {
  folder: RssTreeFolderNode;
  activeFolderId?: string;
  activeFeedId?: string;
  onRefresh: () => Promise<void>;
}): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const renameFolder = async (): Promise<void> => {
    const name = window.prompt('Folder name', folder.name);
    if (!name) return;
    await rssTnetApi.rss.folders.rename({ folderId: folder.id, name });
    await onRefresh();
  };
  const moveFolder = async (): Promise<void> => {
    const parentId = window.prompt('Move to folder id. Leave empty for root.', '');
    if (parentId === null) return;
    await rssTnetApi.rss.folders.move({ folderId: folder.id, parentId: parentId || undefined });
    await onRefresh();
  };
  const deleteFolder = async (): Promise<void> => {
    if (
      !window.confirm(
        `Delete folder "${folder.name}" and all nested feeds? This also deletes cached items.`
      )
    ) {
      return;
    }
    await rssTnetApi.rss.folders.remove({ folderId: folder.id });
    await onRefresh();
  };
  return (
    <div className={styles.folder}>
      <div className={styles.nodeRow}>
        <button
          type="button"
          draggable
          className={[styles.node, folder.id === activeFolderId ? styles.active : ''].join(' ')}
          onDragStart={(event) =>
            event.dataTransfer.setData('application/x-rss-folder-id', folder.id)
          }
          onDragOver={(event) => event.preventDefault()}
          onDrop={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const feedId = event.dataTransfer.getData('application/x-rss-feed-id');
            const droppedFolderId = event.dataTransfer.getData('application/x-rss-folder-id');
            if (feedId) await rssTnetApi.rss.feeds.move({ feedId, folderId: folder.id });
            if (droppedFolderId && droppedFolderId !== folder.id) {
              await rssTnetApi.rss.folders.move({
                folderId: droppedFolderId,
                parentId: folder.id
              });
            }
            await onRefresh();
          }}
          onClick={() => dispatch(selectRssFolder(folder.id))}
        >
          <span className={styles.folderLabel}>{folder.name}</span>
        </button>
        <button
          className={styles.iconButton}
          type="button"
          title="Rename folder"
          onClick={renameFolder}
        >
          edit
        </button>
        <button
          className={styles.iconButton}
          type="button"
          title="Move folder"
          onClick={moveFolder}
        >
          drive_file_move
        </button>
        <button
          className={styles.iconButton}
          type="button"
          title="Delete folder"
          onClick={deleteFolder}
        >
          delete
        </button>
      </div>
      <div className={styles.children}>
        {folder.folders.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            activeFolderId={activeFolderId}
            activeFeedId={activeFeedId}
            onRefresh={onRefresh}
          />
        ))}
        {folder.feeds.map((feed) => (
          <FeedNode key={feed.id} feed={feed} activeFeedId={activeFeedId} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
};

const FeedNode = ({
  feed,
  activeFeedId,
  onRefresh
}: {
  feed: {
    id: string;
    title: string;
    unreadCount: number;
    lastSyncedAt?: string;
    lastSyncError?: string;
  };
  activeFeedId?: string;
  onRefresh: () => Promise<void>;
}): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const renameFeed = async (): Promise<void> => {
    const title = window.prompt('Feed title', feed.title);
    if (!title) return;
    await rssTnetApi.rss.feeds.update({ feedId: feed.id, title });
    await onRefresh();
  };
  const moveFeed = async (): Promise<void> => {
    const folderId = window.prompt('Move to folder id. Leave empty for root.', '');
    if (folderId === null) return;
    await rssTnetApi.rss.feeds.move({ feedId: feed.id, folderId: folderId || undefined });
    await onRefresh();
  };
  const deleteFeed = async (): Promise<void> => {
    if (!window.confirm(`Delete feed "${feed.title}" and cached items?`)) return;
    await rssTnetApi.rss.feeds.remove({ feedId: feed.id });
    await onRefresh();
  };
  const syncFeed = async (): Promise<void> => {
    dispatch(setRssSyncing(true));
    try {
      const result = await rssTnetApi.rss.feeds.sync({ feedId: feed.id });
      dispatch(setRssFeeds(result.feeds));
      await onRefresh();
    } finally {
      dispatch(setRssSyncing(false));
    }
  };
  return (
    <div className={styles.nodeRow}>
      <button
        type="button"
        draggable
        className={[styles.node, feed.id === activeFeedId ? styles.active : ''].join(' ')}
        onDragStart={(event) => event.dataTransfer.setData('application/x-rss-feed-id', feed.id)}
        onClick={() => dispatch(selectRssFeed(feed.id))}
      >
        <span>{feed.title}</span>
        {feed.lastSyncError ? (
          <span className={styles.errorDot} title={feed.lastSyncError} />
        ) : null}
        {feed.lastSyncedAt ? (
          <span className={styles.syncTime} title={`Last synced ${feed.lastSyncedAt}`}>
            synced
          </span>
        ) : null}
        <span className={styles.count}>{feed.unreadCount}</span>
      </button>
      <button className={styles.iconButton} type="button" title="Sync feed" onClick={syncFeed}>
        sync
      </button>
      <button className={styles.iconButton} type="button" title="Rename feed" onClick={renameFeed}>
        edit
      </button>
      <button className={styles.iconButton} type="button" title="Move feed" onClick={moveFeed}>
        drive_file_move
      </button>
      <button className={styles.iconButton} type="button" title="Delete feed" onClick={deleteFeed}>
        delete
      </button>
    </div>
  );
};

const viewLabel = (view: 'all' | 'unread' | 'starred' | 'archived'): string => {
  if (view === 'all') return 'All';
  if (view === 'unread') return 'Unread';
  if (view === 'starred') return 'Starred';
  return 'Archived';
};
