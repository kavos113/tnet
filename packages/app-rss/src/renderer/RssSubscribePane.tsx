import { useState } from 'react';
import { rssTnetApi } from './rssTnetApi';
import { setRssError, setRssFeeds, setRssTree } from './rssSlice';
import { useRssDispatch } from './storeHooks';
import controlStyles from './RssControls.module.css';
import styles from './RssSubscribePane.module.css';

interface RssSubscribePaneProps {
  selectedFolderId?: string;
  onFeedReady: (feedId: string) => Promise<void>;
}

export const RssSubscribePane = ({
  selectedFolderId,
  onFeedReady
}: RssSubscribePaneProps): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const [feedUrl, setFeedUrl] = useState('');
  const [feedTitle, setFeedTitle] = useState('');

  const refreshNavigation = async (): Promise<void> => {
    const [feeds, tree] = await Promise.all([
      rssTnetApi.rss.feeds.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(tree));
  };

  const addFeed = async (): Promise<void> => {
    if (!feedUrl.trim()) return;
    const feed = await rssTnetApi.rss.feeds.create({
      title: feedTitle,
      url: feedUrl,
      folderId: selectedFolderId
    });
    setFeedUrl('');
    setFeedTitle('');
    await refreshNavigation();
    await onFeedReady(feed.id);
  };

  const importLocalXml = async (): Promise<void> => {
    const filePath = window.prompt('Local RSS/Atom XML file path');
    if (!filePath) return;
    const feed = await rssTnetApi.rss.feeds.importLocalXml({
      title: feedTitle,
      filePath,
      folderId: selectedFolderId
    });
    await refreshNavigation();
    await onFeedReady(feed.id);
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
      if (!feedTitle.trim()) setFeedTitle(discovered[0].title ?? '');
      setFeedUrl(discovered[0].url);
    }
  };

  const autoFillTitle = async (): Promise<void> => {
    if (!feedUrl.trim() || feedTitle.trim()) return;
    await discoverFeeds();
  };

  const reportError = (error: unknown): void => {
    dispatch(setRssError(error instanceof Error ? error.message : String(error)));
  };

  return (
    <section className={styles.subscribePane} aria-label="Subscribe feed">
      <div className={styles.subscribeHeader}>
        <h3>Subscribe Feed</h3>
      </div>
      <form
        className={styles.subscribeForm}
        onSubmit={(event) => {
          event.preventDefault();
          addFeed().catch(reportError);
        }}
      >
        <label className={styles.field}>
          <span>Title</span>
          <input
            className={controlStyles.input}
            value={feedTitle}
            onChange={(event) => setFeedTitle(event.target.value)}
            placeholder="Feed title"
            aria-label="Feed title"
          />
        </label>
        <label className={styles.field}>
          <span>URL</span>
          <input
            className={controlStyles.input}
            value={feedUrl}
            onChange={(event) => setFeedUrl(event.target.value)}
            onBlur={() => autoFillTitle().catch(reportError)}
            placeholder="https://example.com/feed.xml"
            aria-label="Feed URL"
          />
        </label>
        <div className={styles.subscribeActions}>
          <button className={controlStyles.button} type="submit">
            Subscribe
          </button>
          <button
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() => discoverFeeds().catch(reportError)}
          >
            Discover
          </button>
          <button
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() => importLocalXml().catch(reportError)}
          >
            Import XML
          </button>
          <button
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() => importOpml().catch(reportError)}
          >
            Import OPML
          </button>
          <button
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() => exportOpml().catch(reportError)}
          >
            Export OPML
          </button>
        </div>
      </form>
    </section>
  );
};
