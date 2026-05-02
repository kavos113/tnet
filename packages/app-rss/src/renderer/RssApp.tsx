import { useEffect, useMemo, useState } from 'react';
import { rssTnetApi } from './rssTnetApi';
import {
  appendRssItems,
  selectRssItem,
  setRssError,
  setRssFeeds,
  setRssItems,
  setRssSyncing,
  setRssTree,
  upsertRssItem
} from './rssSlice';
import { useRssDispatch, useRssSelector } from './storeHooks';
import styles from './RssApp.module.css';

export const RssApp = (): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const {
    items,
    nextCursor,
    selectedFeedId,
    selectedFolderId,
    selectedItemId,
    selectedView,
    settings,
    isSyncing,
    error
  } = useRssSelector((state) => state.rss);
  const [feedUrl, setFeedUrl] = useState('');
  const [feedTitle, setFeedTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId),
    [items, selectedItemId]
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
      .catch((loadError: unknown) =>
        dispatch(setRssError(loadError instanceof Error ? loadError.message : String(loadError)))
      );
  }, [dispatch, searchQuery, selectedFeedId, selectedFolderId, selectedView]);

  const addFeed = async (): Promise<void> => {
    if (!feedUrl.trim()) return;
    const feed = await rssTnetApi.rss.feeds.create({
      title: feedTitle,
      url: feedUrl,
      folderId: selectedFolderId
    });
    setFeedUrl('');
    setFeedTitle('');
    const [feeds, tree] = await Promise.all([
      rssTnetApi.rss.feeds.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(tree));
    await sync(feed.id);
  };

  const sync = async (feedId?: string): Promise<void> => {
    dispatch(setRssSyncing(true));
    try {
      const result = await rssTnetApi.rss.feeds.sync(feedId ? { feedId } : undefined);
      const [tree, listResult] = await Promise.all([
        rssTnetApi.rss.folders.listTree(),
        rssTnetApi.rss.items.list({
          view: selectedView,
          feedId: selectedFeedId,
          folderId: selectedFolderId,
          searchQuery
        })
      ]);
      dispatch(setRssFeeds(result.feeds));
      dispatch(setRssTree(tree));
      dispatch(setRssItems(listResult));
    } finally {
      dispatch(setRssSyncing(false));
    }
  };

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

  return (
    <main className={styles.root}>
      <section className={styles.listPane} aria-label="RSS items">
        <div className={styles.toolbar}>
          <h2>RSS</h2>
          <button className={styles.secondaryButton} type="button" onClick={() => sync()}>
            {isSyncing ? 'Syncing' : 'Sync All'}
          </button>
        </div>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            addFeed().catch((addError: unknown) =>
              dispatch(setRssError(addError instanceof Error ? addError.message : String(addError)))
            );
          }}
        >
          <input
            className={styles.input}
            value={feedTitle}
            onChange={(event) => setFeedTitle(event.target.value)}
            placeholder="Feed title"
            aria-label="Feed title"
          />
          <input
            className={styles.input}
            value={feedUrl}
            onChange={(event) => setFeedUrl(event.target.value)}
            placeholder="https://example.com/feed.xml"
            aria-label="Feed URL"
          />
          <button className={styles.button} type="submit">
            Add
          </button>
        </form>
        <div className={styles.form}>
          <input
            className={styles.input}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search items"
            aria-label="Search RSS items"
          />
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
        <div className={styles.itemList}>
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
              onClick={() => openItem(item.id)}
            >
              <span className={styles.itemTitle}>
                {item.starred ? '★ ' : ''}
                {item.title}
              </span>
              <span className={styles.itemMeta}>
                {formatDate(item.publishedAt ?? item.fetchedAt)}
              </span>
              {item.summary ? <span className={styles.itemSummary}>{item.summary}</span> : null}
            </button>
          ))}
          {nextCursor ? (
            <button className={styles.secondaryButton} type="button" onClick={loadMore}>
              Load More
            </button>
          ) : null}
        </div>
      </section>
      <section className={styles.detailPane} aria-label="RSS item detail">
        {selectedItem ? (
          <RssItemDetail itemId={selectedItem.id} />
        ) : (
          <div className={styles.empty}>Select an item.</div>
        )}
      </section>
    </main>
  );
};

const RssItemDetail = ({ itemId }: { itemId: string }): React.JSX.Element | null => {
  const dispatch = useRssDispatch();
  const item = useRssSelector((state) =>
    state.rss.items.find((candidate) => candidate.id === itemId)
  );
  if (!item) return null;
  const update = async (next: Promise<typeof item>): Promise<void> => {
    dispatch(upsertRssItem(await next));
  };
  return (
    <>
      <header className={styles.detailHeader}>
        <h1>{item.title}</h1>
        <div className={styles.itemMeta}>
          {formatDate(item.publishedAt ?? item.fetchedAt)} {item.author ? `by ${item.author}` : ''}
        </div>
        <div className={styles.detailActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() =>
              update(
                item.readAt
                  ? rssTnetApi.rss.items.markUnread({ itemId })
                  : rssTnetApi.rss.items.markRead({ itemId })
              )
            }
          >
            {item.readAt ? 'Mark Unread' : 'Mark Read'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() =>
              update(rssTnetApi.rss.items.setStarred({ itemId, starred: !item.starred }))
            }
          >
            {item.starred ? 'Unstar' : 'Star'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() =>
              update(rssTnetApi.rss.items.archive({ itemId, archived: !item.archivedAt }))
            }
          >
            {item.archivedAt ? 'Unarchive' : 'Archive'}
          </button>
          {item.link ? (
            <a className={styles.secondaryButton} href={item.link} target="_blank" rel="noreferrer">
              Open Link
            </a>
          ) : null}
        </div>
      </header>
      <article
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: item.contentHtml ?? item.summary ?? '' }}
      />
    </>
  );
};

const formatDate = (value: string | undefined): string => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
};
