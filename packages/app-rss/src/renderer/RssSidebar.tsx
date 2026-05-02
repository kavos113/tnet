import { useEffect, useMemo, useRef, useState } from 'react';
import type { FileItem } from '@tnet/shared/types/file';
import {
  WorkspaceFileTree,
  type WorkspaceNewEntryState
} from '@tnet/ui/workspace/WorkspaceFileTree';
import { rssTnetApi } from './rssTnetApi';
import {
  openRssSubscribe,
  selectRssFeed,
  selectRssFolder,
  selectRssSystemView,
  setRssFeeds,
  setRssFolders,
  setRssTree
} from './rssSlice';
import { useRssDispatch, useRssSelector } from './storeHooks';
import type { RssTreeFeedNode, RssTreeFolderNode } from '@tnet/app-rss/shared/rssTypes';
import styles from './RssSidebar.module.css';

const rssFeedPathPrefix = 'rss-feed:';

const emptyNewFolder: WorkspaceNewEntryState = {
  isActive: false,
  mode: 'directory',
  parentPath: null,
  name: ''
};

export const RssSidebar = (): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const rootInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState<WorkspaceNewEntryState>(emptyNewFolder);
  const { tree, selectedView, selectedFeedId, selectedFolderId } = useRssSelector(
    (state) => state.rss
  );
  const feedTree = useMemo(() => toTreeItems(tree.folders, tree.feeds), [tree.feeds, tree.folders]);
  const shouldShowNewFolderAtRoot = newFolder.isActive && newFolder.parentPath === null;

  useEffect(() => {
    if (!shouldShowNewFolderAtRoot) return;
    rootInputRef.current?.focus();
    rootInputRef.current?.select();
  }, [shouldShowNewFolderAtRoot]);

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

  const startNewFolder = (): void => {
    if (selectedFolderId) {
      setExpandedFolderIds((current) =>
        current.includes(selectedFolderId) ? current : [...current, selectedFolderId]
      );
    }
    setNewFolder({
      isActive: true,
      mode: 'directory',
      parentPath: selectedFolderId ?? null,
      name: 'New Folder'
    });
  };

  const cancelNewFolder = (): void => {
    setNewFolder(emptyNewFolder);
  };

  const confirmNewFolder = async (): Promise<void> => {
    if (!newFolder.isActive) return;
    const name = newFolder.name.trim();
    if (!name) {
      cancelNewFolder();
      return;
    }
    const folder = await rssTnetApi.rss.folders.create({
      parentId: newFolder.parentPath ?? undefined,
      name
    });
    await refreshTree();
    dispatch(selectRssFolder(folder.id));
    setExpandedFolderIds((current) =>
      newFolder.parentPath && !current.includes(newFolder.parentPath)
        ? [...current, newFolder.parentPath]
        : current
    );
    cancelNewFolder();
  };

  const activateTreeItem = (item: FileItem): void => {
    if (item.isDirectory) {
      dispatch(selectRssFolder(item.path));
      setExpandedFolderIds((current) =>
        current.includes(item.path)
          ? current.filter((candidate) => candidate !== item.path)
          : [...current, item.path]
      );
      return;
    }
    const feedId = feedIdFromPath(item.path);
    if (feedId) dispatch(selectRssFeed(feedId));
  };

  const onRootNewFolderKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmNewFolder().catch((error: unknown) => {
        console.error('Failed to create RSS folder', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelNewFolder();
    }
  };

  const handleDropOnRoot = async (event: React.DragEvent): Promise<void> => {
    event.preventDefault();
    const feedId = event.dataTransfer.getData('application/x-rss-feed-id');
    if (feedId) await rssTnetApi.rss.feeds.move({ feedId });
    await refreshTree();
  };

  return (
    <aside className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>RSS Feeds</span>
        <div className={styles.headerActions}>
          <button
            className={styles.button}
            type="button"
            onClick={() => dispatch(openRssSubscribe())}
          >
            New Feed
          </button>
          <button className={styles.button} type="button" onClick={startNewFolder}>
            New Folder
          </button>
        </div>
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
        <section className={styles.directorySection} aria-label="RSS folders">
          <ul className={styles.fileList}>
            {shouldShowNewFolderAtRoot ? (
              <li className={styles.newItem}>
                <div className={styles.treeItem}>
                  <span
                    className={`material-icons-round ${styles.chevron} ${styles.iconPlaceholder}`}
                  >
                    chevron_right
                  </span>
                  <span className={`material-icons ${styles.folderIcon}`}>folder</span>
                  <input
                    ref={rootInputRef}
                    className={styles.newInput}
                    value={newFolder.name}
                    onChange={(event) =>
                      setNewFolder((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                    onKeyDown={onRootNewFolderKeyDown}
                    onBlur={cancelNewFolder}
                  />
                </div>
              </li>
            ) : null}
            <WorkspaceFileTree
              items={feedTree}
              selectedPath={selectedFeedId ? feedPath(selectedFeedId) : selectedFolderId}
              expandedPaths={expandedFolderIds}
              onActivateItem={activateTreeItem}
              newEntry={newFolder}
              onNewEntryNameChange={(name) =>
                setNewFolder((current) => ({
                  ...current,
                  name
                }))
              }
              onConfirmNewEntry={confirmNewFolder}
              onCancelNewEntry={cancelNewFolder}
              getItemIcon={(item, isExpanded) =>
                item.isDirectory ? (isExpanded ? 'folder_open' : 'folder') : 'rss_feed'
              }
            />
          </ul>
        </section>
      </div>
    </aside>
  );
};

const toTreeItems = (folders: RssTreeFolderNode[], feeds: RssTreeFeedNode[]): FileItem[] => [
  ...folders.map(toFolderItem),
  ...feeds.map(toFeedItem)
];

const toFolderItem = (folder: RssTreeFolderNode): FileItem => ({
  name: folder.name,
  path: folder.id,
  isDirectory: true,
  children: toTreeItems(folder.folders, folder.feeds)
});

const toFeedItem = (feed: RssTreeFeedNode): FileItem => ({
  name: feed.unreadCount > 0 ? `${feed.title} (${feed.unreadCount})` : feed.title,
  path: feedPath(feed.id),
  isDirectory: false
});

const feedPath = (feedId: string): string => `${rssFeedPathPrefix}${feedId}`;

const feedIdFromPath = (path: string): string | undefined =>
  path.startsWith(rssFeedPathPrefix) ? path.slice(rssFeedPathPrefix.length) : undefined;

const viewLabel = (view: 'all' | 'unread' | 'starred' | 'archived'): string => {
  if (view === 'all') return 'All';
  if (view === 'unread') return 'Unread';
  if (view === 'starred') return 'Starred';
  return 'Archived';
};
