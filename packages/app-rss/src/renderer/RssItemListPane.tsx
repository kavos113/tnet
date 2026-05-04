import { useCallback, useEffect, useRef, useState } from 'react';
import type { RssFeed, RssItem } from '@tnet/app-rss/shared/rssTypes';
import { formatRssDate } from './formatRssDate';
import type { RssSyncProgress } from './rssSlice';
import controlStyles from './RssControls.module.css';
import styles from './RssItemListPane.module.css';

interface RssItemListPaneProps {
  isSyncing: boolean;
  items: RssItem[];
  nextCursor?: string;
  searchQuery: string;
  selectedFeed?: RssFeed;
  selectedItemId?: string;
  syncProgress?: RssSyncProgress;
  summaryLineClamp: number;
  onDeleteSelectedFeed: () => Promise<void>;
  onLoadMore: () => Promise<void>;
  onMoveSelectedFeed: () => Promise<void>;
  onOpenItem: (itemId: string) => Promise<void>;
  onRenameSelectedFeed: () => Promise<void>;
  onSearchQueryChange: (query: string) => void;
  onSyncAll: () => Promise<void>;
  onSyncSelectedFeed: () => Promise<void>;
  onError: (error: unknown) => void;
}

export const RssItemListPane = ({
  isSyncing,
  items,
  nextCursor,
  searchQuery,
  selectedFeed,
  selectedItemId,
  syncProgress,
  summaryLineClamp,
  onDeleteSelectedFeed,
  onLoadMore,
  onMoveSelectedFeed,
  onOpenItem,
  onRenameSelectedFeed,
  onSearchQueryChange,
  onSyncAll,
  onSyncSelectedFeed,
  onError
}: RssItemListPaneProps): React.JSX.Element => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, nextCursor, onLoadMore]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!nextCursor || !sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore().catch(onError);
        }
      },
      {
        root: listRef.current,
        rootMargin: '160px 0px'
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, nextCursor, onError]);

  return (
    <>
      <div className={styles.toolbar}>
        <h2 title={selectedFeed?.title}>{selectedFeed?.title ?? 'RSS'}</h2>
        {selectedFeed ? (
          <div className={styles.feedActions} aria-label="Selected feed actions">
            <button
              className={controlStyles.iconButton}
              type="button"
              title="Sync selected feed"
              onClick={() => onSyncSelectedFeed().catch(onError)}
            >
              <span className="material-symbols-rounded">sync</span>
            </button>
            <button
              className={controlStyles.iconButton}
              type="button"
              title="Rename selected feed"
              onClick={() => onRenameSelectedFeed().catch(onError)}
            >
              <span className="material-symbols-rounded">edit</span>
            </button>
            <button
              className={controlStyles.iconButton}
              type="button"
              title="Move selected feed"
              onClick={() => onMoveSelectedFeed().catch(onError)}
            >
              <span className="material-symbols-rounded">drive_file_move</span>
            </button>
            <button
              className={controlStyles.iconButton}
              type="button"
              title="Delete selected feed"
              onClick={() => onDeleteSelectedFeed().catch(onError)}
            >
              <span className="material-symbols-rounded">delete</span>
            </button>
          </div>
        ) : null}
        <button
          className={controlStyles.secondaryButton}
          type="button"
          disabled={isSyncing}
          onClick={() => onSyncAll().catch(onError)}
        >
          {isSyncing ? 'Syncing' : 'Sync All'}
        </button>
      </div>
      {isSyncing && syncProgress && syncProgress.total > 0 ? (
        <div className={styles.syncProgress} role="status">
          <span>
            Syncing {syncProgress.current}/{syncProgress.total}
            {syncProgress.currentFeedTitle ? `: ${syncProgress.currentFeedTitle}` : ''}
          </span>
          <progress value={syncProgress.current} max={syncProgress.total} />
        </div>
      ) : null}
      <div className={styles.form}>
        <input
          className={controlStyles.input}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search items"
          aria-label="Search RSS items"
        />
      </div>
      <div className={styles.itemList} ref={listRef}>
        {items.length === 0 ? <div className={styles.empty}>No items.</div> : null}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              styles.itemRow,
              item.readAt ? styles.itemRowRead : '',
              item.id === selectedItemId ? styles.itemRowActive : ''
            ].join(' ')}
            onClick={() => onOpenItem(item.id).catch(onError)}
          >
            <span className={styles.itemHeading}>
              <span className={styles.itemTitle}>
                {item.starred ? '☆' : ''}
                {item.title}
              </span>
              <span className={styles.itemMeta}>
                {formatRssDate(item.publishedAt ?? item.fetchedAt)}
              </span>
            </span>
            {summaryLineClamp > 0 && item.summary ? (
              <span className={styles.itemSummary}>{item.summary}</span>
            ) : null}
          </button>
        ))}
        {nextCursor ? (
          <>
            <div
              className={styles.loadMoreSentinel}
              ref={loadMoreSentinelRef}
              aria-label="Load more RSS items"
            />
            <button
              className={controlStyles.secondaryButton}
              type="button"
              disabled={isLoadingMore}
              onClick={() => loadMore().catch(onError)}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </>
        ) : null}
      </div>
    </>
  );
};
