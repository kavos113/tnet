import type { RssFeed, RssSystemView } from '@tnet/app-rss/shared/rssTypes';
import { rssTnetApi } from './rssTnetApi';
import { openRssSubscribe, setRssFeeds, setRssItems, setRssSyncing, setRssTree } from './rssSlice';
import { useRssDispatch } from './storeHooks';

interface RssFeedActionsInput {
  selectedFeed?: RssFeed;
  selectedFeedId?: string;
  selectedFolderId?: string;
  selectedView: RssSystemView;
  searchQuery: string;
}

export interface RssFeedActions {
  refreshNavigation: () => Promise<void>;
  sync: (feedId?: string) => Promise<void>;
  renameSelectedFeed: () => Promise<void>;
  moveSelectedFeed: () => Promise<void>;
  deleteSelectedFeed: () => Promise<void>;
}

export const useRssFeedActions = ({
  selectedFeed,
  selectedFeedId,
  selectedFolderId,
  selectedView,
  searchQuery
}: RssFeedActionsInput): RssFeedActions => {
  const dispatch = useRssDispatch();

  const refreshNavigation = async (): Promise<void> => {
    const [feeds, tree] = await Promise.all([
      rssTnetApi.rss.feeds.list(),
      rssTnetApi.rss.folders.listTree()
    ]);
    dispatch(setRssFeeds(feeds));
    dispatch(setRssTree(tree));
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

  return {
    refreshNavigation,
    sync,
    renameSelectedFeed,
    moveSelectedFeed,
    deleteSelectedFeed
  };
};
