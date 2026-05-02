import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { RssRuntime } from './RssRuntime';
import rssReducer from './rssSlice';
import { rssTnetApi } from './rssTnetApi';

vi.mock('./rssTnetApi', () => ({
  rssTnetApi: {
    rss: {
      config: {
        loadGlobal: vi.fn()
      },
      feeds: {
        sync: vi.fn(),
        list: vi.fn()
      },
      folders: {
        list: vi.fn(),
        listTree: vi.fn()
      },
      items: {
        list: vi.fn()
      }
    }
  }
}));

describe('RssRuntime', () => {
  let store: EnhancedStore<{ rss: ReturnType<typeof rssReducer> }>;

  beforeEach(() => {
    vi.resetAllMocks();
    store = configureStore({ reducer: { rss: rssReducer } });
    vi.mocked(rssTnetApi.rss.config.loadGlobal).mockResolvedValue({
      settings: {
        ...defaultRssGlobalSettings(),
        syncIntervalMinutes: 0.001,
        syncOnStartup: true
      }
    });
    vi.mocked(rssTnetApi.rss.feeds.sync).mockResolvedValue({
      feeds: [],
      syncedFeedIds: [],
      failedFeedIds: []
    });
    vi.mocked(rssTnetApi.rss.folders.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.feeds.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.folders.listTree).mockResolvedValue({ folders: [], feeds: [] });
    vi.mocked(rssTnetApi.rss.items.list).mockResolvedValue({ items: [] });
  });

  it('restores data and starts periodic sync', async () => {
    const rendered = render(
      <Provider store={store}>
        <RssRuntime />
      </Provider>
    );

    await waitFor(() => expect(store.getState().rss.isRestored).toBe(true));
    expect(rssTnetApi.rss.feeds.sync).toHaveBeenCalled();

    await waitFor(
      () => expect(vi.mocked(rssTnetApi.rss.feeds.sync).mock.calls.length).toBeGreaterThan(1),
      {
        timeout: 1000
      }
    );
    rendered.unmount();
  });
});
