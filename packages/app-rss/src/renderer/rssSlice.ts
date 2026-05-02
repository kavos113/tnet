import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RssGlobalSettings } from '@tnet/app-rss/shared/config';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import type {
  ListRssItemsResult,
  RssFeed,
  RssFolder,
  RssItem,
  RssSystemView,
  RssTreeSnapshot
} from '@tnet/app-rss/shared/rssTypes';

interface RssState {
  folders: RssFolder[];
  feeds: RssFeed[];
  tree: RssTreeSnapshot;
  items: RssItem[];
  nextCursor?: string;
  selectedView: RssSystemView;
  selectedFeedId?: string;
  selectedFolderId?: string;
  selectedItemId?: string;
  isSubscribeOpen: boolean;
  settings: RssGlobalSettings;
  isRestored: boolean;
  isSyncing: boolean;
  error?: string;
}

const initialState: RssState = {
  folders: [],
  feeds: [],
  tree: { folders: [], feeds: [] },
  items: [],
  selectedView: defaultRssGlobalSettings().defaultFilter,
  isSubscribeOpen: true,
  settings: defaultRssGlobalSettings(),
  isRestored: false,
  isSyncing: false
};

const rssSlice = createSlice({
  name: 'rss',
  initialState,
  reducers: {
    restoreRss: (
      state,
      action: PayloadAction<{
        folders: RssFolder[];
        feeds: RssFeed[];
        tree: RssTreeSnapshot;
        items: ListRssItemsResult;
        settings: RssGlobalSettings;
      }>
    ) => {
      state.folders = action.payload.folders;
      state.feeds = action.payload.feeds;
      state.tree = action.payload.tree;
      state.items = action.payload.items.items;
      state.nextCursor = action.payload.items.nextCursor;
      state.settings = action.payload.settings;
      state.selectedView = action.payload.settings.defaultFilter;
      state.isRestored = true;
    },
    setRssFolders: (state, action: PayloadAction<RssFolder[]>) => {
      state.folders = action.payload;
    },
    setRssFeeds: (state, action: PayloadAction<RssFeed[]>) => {
      state.feeds = action.payload;
    },
    setRssTree: (state, action: PayloadAction<RssTreeSnapshot>) => {
      state.tree = action.payload;
    },
    setRssItems: (state, action: PayloadAction<ListRssItemsResult>) => {
      state.items = action.payload.items;
      state.nextCursor = action.payload.nextCursor;
    },
    appendRssItems: (state, action: PayloadAction<ListRssItemsResult>) => {
      state.items.push(...action.payload.items);
      state.nextCursor = action.payload.nextCursor;
    },
    upsertRssItem: (state, action: PayloadAction<RssItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) state.items[index] = action.payload;
    },
    selectRssSystemView: (state, action: PayloadAction<RssSystemView>) => {
      state.selectedView = action.payload;
      state.selectedFeedId = undefined;
      state.selectedFolderId = undefined;
      state.selectedItemId = undefined;
      state.isSubscribeOpen = false;
    },
    selectRssFeed: (state, action: PayloadAction<string>) => {
      state.selectedFeedId = action.payload;
      state.selectedFolderId = undefined;
      state.selectedView = 'all';
      state.selectedItemId = undefined;
      state.isSubscribeOpen = false;
    },
    selectRssFolder: (state, action: PayloadAction<string>) => {
      state.selectedFolderId = action.payload;
      state.selectedFeedId = undefined;
      state.selectedView = 'all';
      state.selectedItemId = undefined;
      state.isSubscribeOpen = false;
    },
    selectRssItem: (state, action: PayloadAction<string | undefined>) => {
      state.selectedItemId = action.payload;
    },
    setRssSettings: (state, action: PayloadAction<RssGlobalSettings>) => {
      state.settings = action.payload;
    },
    setRssSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setRssError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
    openRssSubscribe: (state) => {
      state.isSubscribeOpen = true;
      state.selectedFeedId = undefined;
      state.selectedItemId = undefined;
    }
  }
});

export const {
  appendRssItems,
  openRssSubscribe,
  restoreRss,
  selectRssFeed,
  selectRssFolder,
  selectRssItem,
  selectRssSystemView,
  setRssError,
  setRssFeeds,
  setRssFolders,
  setRssItems,
  setRssSettings,
  setRssSyncing,
  setRssTree,
  upsertRssItem
} = rssSlice.actions;

export default rssSlice.reducer;
