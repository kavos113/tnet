import { useMemo, useState } from 'react';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
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
import { feedIdFromPath, feedPath, toRssTreeFileItems } from './rssTreeFileItems';
import styles from './RssSidebar.module.css';

const emptyNewFolder: WorkspaceNewEntryState = {
  isActive: false,
  mode: 'directory',
  parentPath: null,
  name: ''
};

const rssFeedDragType = 'application/x-rss-feed-id';
const rssFolderDragType = 'application/x-rss-folder-id';

export const RssSidebar = (): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState<WorkspaceNewEntryState>(emptyNewFolder);
  const { tree, selectedView, selectedFeedId, selectedFolderId, isSidebarDetailsLoading } =
    useRssSelector((state) => state.rss);
  const feedTree = useMemo(
    () => toRssTreeFileItems(tree.folders, tree.feeds),
    [tree.feeds, tree.folders]
  );

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

  const startNewFeed = (): void => {
    dispatch(openRssSubscribe());
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

  const handleDragStartItem = (item: FileItem, event: React.DragEvent<HTMLElement>): void => {
    if (item.isDirectory) {
      event.dataTransfer.setData(rssFolderDragType, item.path);
      event.dataTransfer.effectAllowed = 'move';
      return;
    }
    const feedId = feedIdFromPath(item.path);
    if (!feedId) return;
    event.dataTransfer.setData(rssFeedDragType, feedId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const moveDraggedEntry = async (
    event: React.DragEvent,
    targetFolderId: string | undefined
  ): Promise<void> => {
    const feedId = event.dataTransfer.getData(rssFeedDragType);
    const folderId = event.dataTransfer.getData(rssFolderDragType);
    if (feedId) {
      await rssTnetApi.rss.feeds.move({ feedId, folderId: targetFolderId });
    } else if (folderId && folderId !== targetFolderId) {
      await rssTnetApi.rss.folders.move({ folderId, parentId: targetFolderId });
    } else {
      return;
    }
    await refreshTree();
    if (targetFolderId) {
      setExpandedFolderIds((current) =>
        current.includes(targetFolderId) ? current : [...current, targetFolderId]
      );
    }
  };

  const handleDropOnItem = async (item: FileItem, event: React.DragEvent): Promise<void> => {
    if (!item.isDirectory) return;
    await moveDraggedEntry(event, item.path);
  };

  const handleDropOnRoot = async (event: React.DragEvent): Promise<void> => {
    event.preventDefault();
    await moveDraggedEntry(event, undefined);
  };

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    onTrigger: startNewFeed
  });

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    shift: true,
    onTrigger: startNewFolder
  });

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
          {isSidebarDetailsLoading ? (
            <div className={styles.loadingStatus} role="status">
              Loading folders and unread counts...
            </div>
          ) : null}
          <ul className={styles.fileList}>
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
              onDragStartItem={handleDragStartItem}
              onDropOnItem={handleDropOnItem}
            />
          </ul>
        </section>
      </div>
    </aside>
  );
};

const viewLabel = (view: 'all' | 'unread' | 'starred' | 'archived'): string => {
  if (view === 'all') return 'All';
  if (view === 'unread') return 'Unread';
  if (view === 'starred') return 'Starred';
  return 'Archived';
};
