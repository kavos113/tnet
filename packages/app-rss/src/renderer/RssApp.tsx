import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { rssTnetApi } from './rssTnetApi';
import {
  appendRssItems,
  selectRssFeed,
  selectRssItem,
  setRssError,
  setRssItems,
  upsertRssItem
} from './rssSlice';
import { RssItemDetail } from './RssItemDetail';
import { RssItemListPane } from './RssItemListPane';
import { RssSubscribePane } from './RssSubscribePane';
import { useRssFeedActions } from './useRssFeedActions';
import { useRssDispatch, useRssSelector } from './storeHooks';
import styles from './RssApp.module.css';
import detailStyles from './RssItemDetail.module.css';
import listStyles from './RssItemListPane.module.css';

export const RssApp = (): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const {
    feeds,
    items,
    nextCursor,
    selectedFeedId,
    selectedFolderId,
    selectedItemId,
    selectedView,
    isSubscribeOpen,
    settings,
    isSyncing,
    syncProgress,
    error
  } = useRssSelector((state) => state.rss);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId),
    [items, selectedItemId]
  );
  const selectedFeed = useMemo(
    () => feeds.find((feed) => feed.id === selectedFeedId),
    [feeds, selectedFeedId]
  );
  const displayStyle = useMemo<RssDisplayStyle>(
    () => ({
      '--rss-summary-lines': String(settings.itemSummaryLineClamp),
      '--rss-font-family': 'var(--tnet-font-family)',
      '--rss-font-size': 'var(--tnet-font-size)',
      '--rss-line-height': String(settings.lineHeight)
    }),
    [settings.itemSummaryLineClamp, settings.lineHeight]
  );
  const feedActions = useRssFeedActions({
    feeds,
    selectedFeed,
    selectedFeedId,
    selectedFolderId,
    selectedView,
    searchQuery
  });
  const reportError = useCallback(
    (caughtError: unknown): void => {
      dispatch(
        setRssError(caughtError instanceof Error ? caughtError.message : String(caughtError))
      );
    },
    [dispatch]
  );

  useEffect(() => {
    rssTnetApi.rss.items
      .list({
        view: selectedView,
        feedId: selectedFeedId,
        folderId: selectedFolderId,
        searchQuery
      })
      .then((result) => dispatch(setRssItems(result)))
      .catch(reportError);
  }, [dispatch, reportError, searchQuery, selectedFeedId, selectedFolderId, selectedView]);

  const openItem = async (itemId: string): Promise<void> => {
    dispatch(selectRssItem(itemId));
    if (!settings.markReadOnOpen) return;
    const updated = await rssTnetApi.rss.items.markRead({ itemId });
    dispatch(upsertRssItem(updated));
  };

  const loadMore = async (): Promise<void> => {
    if (!nextCursor) return;
    const result = await rssTnetApi.rss.items.list({
      view: selectedView,
      feedId: selectedFeedId,
      folderId: selectedFolderId,
      cursor: nextCursor,
      searchQuery
    });
    dispatch(appendRssItems(result));
  };

  const syncAndSelectFeed = async (feedId: string): Promise<void> => {
    await feedActions.sync(feedId);
    dispatch(selectRssFeed(feedId));
  };

  return (
    <main className={styles.root} style={displayStyle}>
      <section className={listStyles.listPane} aria-label="RSS items">
        {error ? <div className={styles.error}>{error}</div> : null}
        {isSubscribeOpen ? (
          <RssSubscribePane selectedFolderId={selectedFolderId} onFeedReady={syncAndSelectFeed} />
        ) : (
          <RssItemListPane
            isSyncing={isSyncing}
            items={items}
            nextCursor={nextCursor}
            searchQuery={searchQuery}
            selectedFeed={selectedFeed}
            selectedItemId={selectedItemId}
            syncProgress={syncProgress}
            summaryLineClamp={settings.itemSummaryLineClamp}
            onDeleteSelectedFeed={feedActions.deleteSelectedFeed}
            onLoadMore={loadMore}
            onMoveSelectedFeed={feedActions.moveSelectedFeed}
            onOpenItem={openItem}
            onRenameSelectedFeed={feedActions.renameSelectedFeed}
            onSearchQueryChange={setSearchQuery}
            onSyncAll={() => feedActions.sync()}
            onSyncSelectedFeed={() =>
              selectedFeed ? feedActions.sync(selectedFeed.id) : Promise.resolve()
            }
            onError={reportError}
          />
        )}
      </section>
      <section className={detailStyles.detailPane} aria-label="RSS item detail">
        {selectedItem ? (
          <RssItemDetail itemId={selectedItem.id} />
        ) : (
          <div className={detailStyles.empty}>Select an item.</div>
        )}
      </section>
    </main>
  );
};

type RssDisplayStyle = CSSProperties &
  Record<
    '--rss-summary-lines' | '--rss-font-family' | '--rss-font-size' | '--rss-line-height',
    string
  >;
