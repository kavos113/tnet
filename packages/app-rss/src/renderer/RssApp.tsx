import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { rssTnetApi } from './rssTnetApi';
import {
  appendRssItems,
  openRssSubscribe,
  selectRssItem,
  selectRssFeed,
  setRssError,
  setRssFeeds,
  setRssItems,
  setRssSyncing,
  setRssTree,
  upsertRssItem
} from './rssSlice';
import { useRssDispatch, useRssSelector } from './storeHooks';
import { extractReadableText } from '@tnet/app-rss/shared/readability';
import { toRssItemMarkdownLink } from '@tnet/app-rss/shared/markdownLink';
import styles from './RssApp.module.css';

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
    error
  } = useRssSelector((state) => state.rss);
  const [feedUrl, setFeedUrl] = useState('');
  const [feedTitle, setFeedTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId),
    [items, selectedItemId]
  );
  const selectedFeed = useMemo(
    () => feeds.find((feed) => feed.id === selectedFeedId),
    [feeds, selectedFeedId]
  );
  const shouldShowSubscribe = isSubscribeOpen;
  const displayStyle = useMemo<RssDisplayStyle>(
    () => ({
      '--rss-summary-lines': String(settings.itemSummaryLineClamp),
      '--rss-font-family': settings.fontFamily,
      '--rss-font-size': `${settings.fontSizePx}px`,
      '--rss-line-height': String(settings.lineHeight)
    }),
    [settings.fontFamily, settings.fontSizePx, settings.itemSummaryLineClamp, settings.lineHeight]
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
    dispatch(selectRssFeed(feed.id));
  };

  const importLocalXml = async (): Promise<void> => {
    const filePath = window.prompt('Local RSS/Atom XML file path');
    if (!filePath) return;
    const feed = await rssTnetApi.rss.feeds.importLocalXml({
      title: feedTitle,
      filePath,
      folderId: selectedFolderId
    });
    const [feeds, tree] = await Promise.all([
      rssTnetApi.rss.feeds.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(tree));
    await sync(feed.id);
    dispatch(selectRssFeed(feed.id));
  };

  const importOpml = async (): Promise<void> => {
    const opml = window.prompt('Paste OPML');
    if (!opml) return;
    const feeds = await rssTnetApi.rss.opml.importText({ opml, folderId: selectedFolderId });
    const tree = await rssTnetApi.rss.folders.listTree();
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(tree));
  };

  const exportOpml = async (): Promise<void> => {
    const opml = await rssTnetApi.rss.opml.exportText();
    await navigator.clipboard?.writeText(opml);
  };

  const discoverFeeds = async (): Promise<void> => {
    if (!feedUrl.trim()) return;
    const discovered = await rssTnetApi.rss.feeds.discover({ url: feedUrl });
    if (discovered[0]) {
      setFeedTitle(discovered[0].title ?? feedTitle);
      setFeedUrl(discovered[0].url);
    }
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

  const refreshNavigation = async (): Promise<void> => {
    const [feeds, tree] = await Promise.all([
      rssTnetApi.rss.feeds.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(tree));
  };

  const renameSelectedFeed = async (): Promise<void> => {
    if (!selectedFeed) return;
    const title = window.prompt('Feed title', selectedFeed.title);
    if (!title) return;
    await rssTnetApi.rss.feeds.update({ feedId: selectedFeed.id, title });
    await refreshNavigation();
  };

  const moveSelectedFeed = async (): Promise<void> => {
    if (!selectedFeed) return;
    const folderId = window.prompt('Move to folder id. Leave empty for root.', '');
    if (folderId === null) return;
    await rssTnetApi.rss.feeds.move({
      feedId: selectedFeed.id,
      folderId: folderId || undefined
    });
    await refreshNavigation();
  };

  const deleteSelectedFeed = async (): Promise<void> => {
    if (!selectedFeed) return;
    if (!window.confirm(`Delete feed "${selectedFeed.title}" and cached items?`)) return;
    await rssTnetApi.rss.feeds.remove({ feedId: selectedFeed.id });
    await refreshNavigation();
    dispatch(openRssSubscribe());
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
    <main className={styles.root} style={displayStyle}>
      <section className={styles.listPane} aria-label="RSS items">
        <div className={styles.toolbar}>
          <h2 title={selectedFeed?.title}>{selectedFeed?.title ?? 'RSS'}</h2>
          {selectedFeed ? (
            <div className={styles.feedActions} aria-label="Selected feed actions">
              <button
                className={styles.iconButton}
                type="button"
                title="Sync selected feed"
                onClick={() => sync(selectedFeed.id)}
              >
                sync
              </button>
              <button
                className={styles.iconButton}
                type="button"
                title="Rename selected feed"
                onClick={() =>
                  renameSelectedFeed().catch((renameError: unknown) =>
                    dispatch(
                      setRssError(
                        renameError instanceof Error ? renameError.message : String(renameError)
                      )
                    )
                  )
                }
              >
                edit
              </button>
              <button
                className={styles.iconButton}
                type="button"
                title="Move selected feed"
                onClick={() =>
                  moveSelectedFeed().catch((moveError: unknown) =>
                    dispatch(
                      setRssError(
                        moveError instanceof Error ? moveError.message : String(moveError)
                      )
                    )
                  )
                }
              >
                drive_file_move
              </button>
              <button
                className={styles.iconButton}
                type="button"
                title="Delete selected feed"
                onClick={() =>
                  deleteSelectedFeed().catch((deleteError: unknown) =>
                    dispatch(
                      setRssError(
                        deleteError instanceof Error ? deleteError.message : String(deleteError)
                      )
                    )
                  )
                }
              >
                delete
              </button>
            </div>
          ) : null}
          <button className={styles.secondaryButton} type="button" onClick={() => sync()}>
            {isSyncing ? 'Syncing' : 'Sync All'}
          </button>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
        {shouldShowSubscribe ? (
          <section className={styles.subscribePane} aria-label="Subscribe feed">
            <div className={styles.subscribeHeader}>
              <h3>Subscribe Feed</h3>
            </div>
            <form
              className={styles.subscribeForm}
              onSubmit={(event) => {
                event.preventDefault();
                addFeed().catch((addError: unknown) =>
                  dispatch(
                    setRssError(addError instanceof Error ? addError.message : String(addError))
                  )
                );
              }}
            >
              <label className={styles.field}>
                <span>Title</span>
                <input
                  className={styles.input}
                  value={feedTitle}
                  onChange={(event) => setFeedTitle(event.target.value)}
                  placeholder="Feed title"
                  aria-label="Feed title"
                />
              </label>
              <label className={styles.field}>
                <span>URL</span>
                <input
                  className={styles.input}
                  value={feedUrl}
                  onChange={(event) => setFeedUrl(event.target.value)}
                  placeholder="https://example.com/feed.xml"
                  aria-label="Feed URL"
                />
              </label>
              <div className={styles.subscribeActions}>
                <button className={styles.button} type="submit">
                  Subscribe
                </button>
                <button className={styles.secondaryButton} type="button" onClick={discoverFeeds}>
                  Discover
                </button>
                <button className={styles.secondaryButton} type="button" onClick={importLocalXml}>
                  Import XML
                </button>
                <button className={styles.secondaryButton} type="button" onClick={importOpml}>
                  Import OPML
                </button>
                <button className={styles.secondaryButton} type="button" onClick={exportOpml}>
                  Export OPML
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            <div className={styles.form}>
              <input
                className={styles.input}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search items"
                aria-label="Search RSS items"
              />
            </div>
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
          </>
        )}
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

type RssDisplayStyle = CSSProperties &
  Record<
    '--rss-summary-lines' | '--rss-font-family' | '--rss-font-size' | '--rss-line-height',
    string
  >;

const RssItemDetail = ({ itemId }: { itemId: string }): React.JSX.Element | null => {
  const dispatch = useRssDispatch();
  const item = useRssSelector((state) =>
    state.rss.items.find((candidate) => candidate.id === itemId)
  );
  const feed = useRssSelector((state) =>
    state.rss.feeds.find((candidate) => candidate.id === item?.feedId)
  );
  const confirmExternalLinks = useRssSelector((state) => state.rss.settings.confirmExternalLinks);
  const [readabilityMode, setReadabilityMode] = useState(false);
  if (!item) return null;
  const update = async (next: Promise<typeof item>): Promise<void> => {
    dispatch(upsertRssItem(await next));
  };
  const openExternalLink = (): void => {
    if (!item.link) return;
    if (confirmExternalLinks && !window.confirm(`Open ${item.link}?`)) return;
    window.open(item.link, '_blank', 'noopener,noreferrer');
  };
  return (
    <>
      <header className={styles.detailHeader}>
        <h1>{item.title}</h1>
        <div className={styles.itemMeta}>
          {feed?.title ?? item.feedId} · {formatDate(item.publishedAt ?? item.fetchedAt)}
          {item.author ? ` by ${item.author}` : ''}
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
            <button className={styles.secondaryButton} type="button" onClick={openExternalLink}>
              Open Link
            </button>
          ) : null}
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => setReadabilityMode((value) => !value)}
          >
            {readabilityMode ? 'HTML View' : 'Readable Text'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => navigator.clipboard?.writeText(toRssItemMarkdownLink(item))}
          >
            Copy Markdown Link
          </button>
        </div>
      </header>
      {readabilityMode ? (
        <article className={styles.content}>
          {extractReadableText(item.contentHtml ?? item.summary ?? '')}
        </article>
      ) : (
        <article
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: item.contentHtml ?? item.summary ?? '' }}
        />
      )}
    </>
  );
};

const formatDate = (value: string | undefined): string => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
};
