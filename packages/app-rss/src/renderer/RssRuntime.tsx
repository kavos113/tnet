import { useEffect } from 'react';
import { rssTnetApi } from './rssTnetApi';
import {
  restoreRss,
  setRssError,
  setRssFeeds,
  setRssItems,
  setRssSyncing,
  setRssTree
} from './rssSlice';
import { useRssDispatch } from './storeHooks';

export const RssRuntime = (): null => {
  const dispatch = useRssDispatch();

  useEffect(() => {
    let canceled = false;
    let intervalId: number | undefined;

    const restore = async (): Promise<void> => {
      const config = await rssTnetApi.rss.config.loadGlobal();
      if (config.settings.syncOnStartup) {
        dispatch(setRssSyncing(true));
        await rssTnetApi.rss.feeds.sync().finally(() => dispatch(setRssSyncing(false)));
      }
      const [folders, feeds, tree, items] = await Promise.all([
        rssTnetApi.rss.folders.list(),
        rssTnetApi.rss.feeds.list(),
        rssTnetApi.rss.folders.listTree(),
        rssTnetApi.rss.items.list({ view: config.settings.defaultFilter })
      ]);
      if (canceled) return;
      dispatch(restoreRss({ folders, feeds, tree, items, settings: config.settings }));
      intervalId = window.setInterval(
        () => {
          dispatch(setRssSyncing(true));
          rssTnetApi.rss.feeds
            .sync()
            .then(async (result) => {
              dispatch(setRssFeeds(result.feeds));
              const [nextTree, nextItems] = await Promise.all([
                rssTnetApi.rss.folders.listTree(),
                rssTnetApi.rss.items.list({ view: config.settings.defaultFilter })
              ]);
              dispatch(setRssTree(nextTree));
              dispatch(setRssItems(nextItems));
            })
            .catch((error: unknown) => {
              console.error('Periodic RSS sync failed', error);
            })
            .finally(() => dispatch(setRssSyncing(false)));
        },
        config.settings.syncIntervalMinutes * 60 * 1000
      );
    };

    restore().catch((error: unknown) => {
      console.error('Failed to restore RSS app', error);
      if (!canceled) dispatch(setRssError(error instanceof Error ? error.message : String(error)));
    });

    return () => {
      canceled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [dispatch]);

  return null;
};
