import { useState } from 'react';
import { parseRssUrlList } from '@tnet/app-rss/shared/rssUrl';
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
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isImportingBulkUrls, setIsImportingBulkUrls] = useState(false);

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

  const importBulkUrls = async (): Promise<void> => {
    const parsed = parseRssUrlList(bulkUrls);
    if (parsed.urls.length === 0) {
      setBulkMessage(
        parsed.invalidLines.length > 0
          ? `No valid URLs found. Invalid: ${parsed.invalidLines.join(', ')}`
          : 'Enter one feed URL per line.'
      );
      return;
    }

    setIsImportingBulkUrls(true);
    setBulkMessage('');
    const failedLines = [...parsed.invalidLines];
    let importedCount = 0;

    try {
      for (const url of parsed.urls) {
        try {
          await rssTnetApi.rss.feeds.create({
            url,
            folderId: selectedFolderId
          });
          importedCount += 1;
        } catch {
          failedLines.push(url);
        }
      }

      if (importedCount > 0) await refreshNavigation();

      if (failedLines.length === 0) {
        setBulkUrls('');
        setBulkMessage(`Imported ${importedCount} feed${importedCount === 1 ? '' : 's'}.`);
        return;
      }

      setBulkUrls(failedLines.join('\n'));
      setBulkMessage(
        importedCount > 0
          ? `Imported ${importedCount} feed${importedCount === 1 ? '' : 's'}. Failed: ${failedLines.join(', ')}`
          : `Failed to import: ${failedLines.join(', ')}`
      );
    } finally {
      setIsImportingBulkUrls(false);
    }
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
            onClick={() => {
              setIsBulkImportOpen((current) => !current);
              setBulkMessage('');
            }}
          >
            Bulk Import URLs
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
      {isBulkImportOpen ? (
        <form
          className={styles.bulkImportForm}
          aria-label="Bulk import feed URLs"
          onSubmit={(event) => {
            event.preventDefault();
            importBulkUrls().catch(reportError);
          }}
        >
          <label className={styles.field}>
            <span>Feed URLs</span>
            <textarea
              className={`${controlStyles.input} ${styles.bulkUrlInput}`}
              value={bulkUrls}
              onChange={(event) => {
                setBulkUrls(event.target.value);
                setBulkMessage('');
              }}
              placeholder="https://example.com/feed.xml"
              aria-label="Feed URLs"
              rows={7}
            />
          </label>
          {bulkMessage ? (
            <div className={styles.bulkImportMessage} role="status">
              {bulkMessage}
            </div>
          ) : null}
          <div className={styles.subscribeActions}>
            <button
              className={controlStyles.button}
              type="submit"
              disabled={isImportingBulkUrls || !bulkUrls.trim()}
            >
              {isImportingBulkUrls ? 'Importing...' : 'Import URLs'}
            </button>
            <button
              className={controlStyles.secondaryButton}
              type="button"
              disabled={isImportingBulkUrls}
              onClick={() => {
                setIsBulkImportOpen(false);
                setBulkMessage('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
};
