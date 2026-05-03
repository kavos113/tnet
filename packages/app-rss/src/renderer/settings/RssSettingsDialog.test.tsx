import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import rssReducer from '../rssSlice';
import { rssTnetApi } from '../rssTnetApi';
import { RssGlobalSettingsPage } from './RssSettingsDialog';

vi.mock('../rssTnetApi', () => ({
  rssTnetApi: {
    rss: {
      config: {
        loadGlobal: vi.fn(),
        saveGlobal: vi.fn()
      }
    }
  }
}));

describe('RssGlobalSettingsPage', () => {
  let store: EnhancedStore<{ rss: ReturnType<typeof rssReducer> }>;

  beforeEach(() => {
    vi.resetAllMocks();
    store = configureStore({ reducer: { rss: rssReducer } });
    vi.mocked(rssTnetApi.rss.config.loadGlobal).mockResolvedValue({
      settings: {
        ...defaultRssGlobalSettings(),
        syncIntervalMinutes: 15
      }
    });
    vi.mocked(rssTnetApi.rss.config.saveGlobal).mockResolvedValue();
  });

  it('loads and saves normalized settings', async () => {
    render(
      <Provider store={store}>
        <RssGlobalSettingsPage onClose={vi.fn()} />
      </Provider>
    );

    const interval = await screen.findByLabelText('Sync interval minutes');
    fireEvent.change(interval, { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Summary lines'), { target: { value: '99' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(rssTnetApi.rss.config.saveGlobal).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            syncIntervalMinutes: 5,
            itemSummaryLineClamp: 8
          })
        })
      )
    );
  });
});
