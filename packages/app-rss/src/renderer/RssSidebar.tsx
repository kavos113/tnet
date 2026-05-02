import { rssTnetApi } from './rssTnetApi';
import {
  selectRssFeed,
  selectRssFolder,
  selectRssSystemView,
  setRssFolders,
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

  return (
    <aside className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>RSS Feeds</span>
        <button className={styles.button} type="button" onClick={() => createFolder()}>
          New Folder
        </button>
      </div>
      <div className={styles.tree}>
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
          />
        ))}
        {tree.feeds.map((feed) => (
          <button
            key={feed.id}
            type="button"
            className={[styles.node, feed.id === selectedFeedId ? styles.active : ''].join(' ')}
            onClick={() => dispatch(selectRssFeed(feed.id))}
          >
            <span>{feed.title}</span>
            {feed.lastSyncError ? (
              <span className={styles.errorDot} title={feed.lastSyncError} />
            ) : null}
            <span className={styles.count}>{feed.unreadCount}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

const FolderNode = ({
  folder,
  activeFolderId,
  activeFeedId
}: {
  folder: RssTreeFolderNode;
  activeFolderId?: string;
  activeFeedId?: string;
}): React.JSX.Element => {
  const dispatch = useRssDispatch();
  return (
    <div className={styles.folder}>
      <button
        type="button"
        className={[styles.node, folder.id === activeFolderId ? styles.active : ''].join(' ')}
        onClick={() => dispatch(selectRssFolder(folder.id))}
      >
        <span className={styles.folderLabel}>{folder.name}</span>
      </button>
      <div className={styles.children}>
        {folder.folders.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            activeFolderId={activeFolderId}
            activeFeedId={activeFeedId}
          />
        ))}
        {folder.feeds.map((feed) => (
          <button
            key={feed.id}
            type="button"
            className={[styles.node, feed.id === activeFeedId ? styles.active : ''].join(' ')}
            onClick={() => dispatch(selectRssFeed(feed.id))}
          >
            <span>{feed.title}</span>
            {feed.lastSyncError ? (
              <span className={styles.errorDot} title={feed.lastSyncError} />
            ) : null}
            <span className={styles.count}>{feed.unreadCount}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const viewLabel = (view: 'all' | 'unread' | 'starred' | 'archived'): string => {
  if (view === 'all') return 'All';
  if (view === 'unread') return 'Unread';
  if (view === 'starred') return 'Starred';
  return 'Archived';
};
