import { useEffect } from 'react';
import { buildRssTree } from '@tnet/app-rss/shared/rssTree';
import { rssTnetApi } from './rssTnetApi';
import {
  restoreRssFeedList,
  restoreRss,
  setRssError,
  setRssFeeds,
  setRssItems,
  setRssSidebarDetailsLoading,
  setRssSyncProgress,
  setRssSyncingFeedIds,
  setRssSyncing,
  setRssTree
} from './rssSlice';
import { useRssDispatch } from './storeHooks';

export const RssRuntime = (): null => {
  const dispatch = useRssDispatch();

  useEffect(() => {
    let canceled = false;
    let intervalId: number | undefined;
    let isRuntimeSyncing = false;

    const restore = async (): Promise<void> => {
      const config = await rssTnetApi.rss.config.loadGlobal();
      const initialFeeds = await rssTnetApi.rss.feeds.listBasic();
      if (canceled) return;
      dispatch(
        restoreRssFeedList({
          feeds: initialFeeds,
          tree: buildRssTree([], initialFeeds),
          settings: config.settings
        })
      );
      const [folders, feeds, items] = await Promise.all([
        rssTnetApi.rss.folders.list(),
        rssTnetApi.rss.feeds.list(),
        rssTnetApi.rss.items.list({ view: config.settings.defaultFilter })
      ]);
      if (canceled) return;
      const tree = buildRssTree(folders, feeds);
      dispatch(restoreRss({ folders, feeds, tree, items, settings: config.settings }));
      dispatch(setRssSidebarDetailsLoading(false));

      const syncFeeds = async (): Promise<void> => {
        if (isRuntimeSyncing) return;
        isRuntimeSyncing = true;
        try {
          const feedsToSync = (await rssTnetApi.rss.feeds.listBasic()).filter(
            (feed) => feed.enabled
          );
          dispatch(setRssSyncing(true));
          dispatch(setRssSyncingFeedIds(feedsToSync.map((feed) => feed.id)));
          dispatch(
            setRssSyncProgress({
              current: 0,
              total: feedsToSync.length,
              currentFeedTitle: `${feedsToSync.length} feeds`
            })
          );
          const result = await rssTnetApi.rss.feeds.sync();
          if (canceled) return;
          const [nextFolders, nextItems] = await Promise.all([
            rssTnetApi.rss.folders.list(),
            rssTnetApi.rss.items.list({ view: config.settings.defaultFilter })
          ]);
          dispatch(setRssFeeds(result.feeds));
          dispatch(setRssTree(buildRssTree(nextFolders, result.feeds)));
          dispatch(setRssItems(nextItems));
        } finally {
          isRuntimeSyncing = false;
          dispatch(setRssSyncing(false));
        }
      };

      if (config.settings.syncOnStartup) {
        syncFeeds().catch((error: unknown) => {
          console.error('Startup RSS sync failed', error);
        });
      }
      intervalId = window.setInterval(
        () => {
          syncFeeds().catch((error: unknown) => {
            console.error('Periodic RSS sync failed', error);
          });
        },
        config.settings.syncIntervalMinutes * 60 * 1000
      );
    };

    restore().catch((error: unknown) => {
      console.error('Failed to restore RSS app', error);
      if (!canceled) {
        dispatch(setRssSidebarDetailsLoading(false));
        dispatch(setRssError(error instanceof Error ? error.message : String(error)));
      }
    });

    return () => {
      canceled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [dispatch]);

  return null;
};
