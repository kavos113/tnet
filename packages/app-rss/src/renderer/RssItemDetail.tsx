import { useState } from 'react';
import { toRssItemMarkdownLink } from '@tnet/app-rss/shared/markdownLink';
import { extractReadableText } from '@tnet/app-rss/shared/readability';
import { formatRssDate } from './formatRssDate';
import { rssTnetApi } from './rssTnetApi';
import { upsertRssItem } from './rssSlice';
import { useRssDispatch, useRssSelector } from './storeHooks';
import controlStyles from './RssControls.module.css';
import styles from './RssItemDetail.module.css';

export const RssItemDetail = ({ itemId }: { itemId: string }): React.JSX.Element | null => {
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
          {feed?.title ?? item.feedId} ﾂｷ {formatRssDate(item.publishedAt ?? item.fetchedAt)}
          {item.author ? ` by ${item.author}` : ''}
        </div>
        <div className={styles.detailActions}>
          <button
            className={controlStyles.secondaryButton}
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
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() =>
              update(rssTnetApi.rss.items.setStarred({ itemId, starred: !item.starred }))
            }
          >
            {item.starred ? 'Unstar' : 'Star'}
          </button>
          <button
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() =>
              update(rssTnetApi.rss.items.archive({ itemId, archived: !item.archivedAt }))
            }
          >
            {item.archivedAt ? 'Unarchive' : 'Archive'}
          </button>
          {item.link ? (
            <button
              className={controlStyles.secondaryButton}
              type="button"
              onClick={openExternalLink}
            >
              Open Link
            </button>
          ) : null}
          <button
            className={controlStyles.secondaryButton}
            type="button"
            onClick={() => setReadabilityMode((value) => !value)}
          >
            {readabilityMode ? 'HTML View' : 'Readable Text'}
          </button>
          <button
            className={controlStyles.secondaryButton}
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
