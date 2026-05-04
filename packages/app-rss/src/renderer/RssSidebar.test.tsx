import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { RssSidebar } from './RssSidebar';
import rssReducer, { restoreRss, restoreRssFeedList } from './rssSlice';
import { rssTnetApi } from './rssTnetApi';

vi.mock('./rssTnetApi', () => ({
  rssTnetApi: {
    rss: {
      folders: {
        create: vi.fn(),
        rename: vi.fn(),
        move: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        listTree: vi.fn()
      },
      feeds: {
        listBasic: vi.fn(),
        update: vi.fn(),
        move: vi.fn(),
        remove: vi.fn(),
        sync: vi.fn(),
        list: vi.fn()
      }
    }
  }
}));

describe('RssSidebar', () => {
  let store: EnhancedStore<{ rss: ReturnType<typeof rssReducer> }>;
  const tree = {
    folders: [
      {
        kind: 'folder' as const,
        id: 'folder-1',
        name: 'Folder',
        folders: [],
        feeds: [
          {
            kind: 'feed' as const,
            id: 'feed-1',
            title: 'Feed',
            unreadCount: 3
          }
        ]
      },
      {
        kind: 'folder' as const,
        id: 'folder-2',
        name: 'Target',
        folders: [],
        feeds: []
      }
    ],
    feeds: []
  };

  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(window, 'prompt', {
      configurable: true,
      value: vi.fn()
    });
    Object.defineProperty(window, 'confirm', {
      configurable: true,
      value: vi.fn()
    });
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRss({
        folders: [
          {
            id: 'folder-1',
            name: 'Folder',
            sortOrder: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          },
          {
            id: 'folder-2',
            name: 'Target',
            sortOrder: 2,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ],
        feeds: [],
        tree,
        items: { items: [] },
        settings: defaultRssGlobalSettings()
      })
    );
    vi.mocked(rssTnetApi.rss.folders.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.feeds.list).mockResolvedValue([]);
    vi.mocked(rssTnetApi.rss.folders.listTree).mockResolvedValue(tree);
    vi.mocked(rssTnetApi.rss.folders.create).mockResolvedValue({
      id: 'folder-3',
      name: 'Created Folder',
      sortOrder: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.folders.move).mockResolvedValue({
      id: 'folder-1',
      name: 'Folder',
      parentId: 'folder-2',
      sortOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });
    vi.mocked(rssTnetApi.rss.feeds.move).mockResolvedValue({
      id: 'feed-1',
      title: 'Feed',
      url: 'https://example.com/feed.xml',
      folderId: 'folder-2',
      sortOrder: 1,
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      unreadCount: 3
    });
    vi.mocked(rssTnetApi.rss.feeds.sync).mockResolvedValue({
      feeds: [],
      syncedFeedIds: ['feed-1'],
      failedFeedIds: []
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('creates folders with the shared directory tree entry', async () => {
    renderSidebar();

    fireEvent.click(screen.getByText('New Folder'));
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'Created Folder' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(rssTnetApi.rss.folders.create).toHaveBeenCalledWith({
        name: 'Created Folder',
        parentId: undefined
      })
    );
    expect(store.getState().rss.selectedFolderId).toBe('folder-3');
  });

  it('opens the subscribe screen with Ctrl+N', () => {
    renderSidebar();

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });

    expect(store.getState().rss.isSubscribeOpen).toBe(true);
  });

  it('creates folders with Ctrl+Shift+N', async () => {
    renderSidebar();

    fireEvent.keyDown(window, { key: 'N', ctrlKey: true, shiftKey: true });
    const input = screen.getByDisplayValue('New Folder');
    fireEvent.change(input, { target: { value: 'Shortcut Folder' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(rssTnetApi.rss.folders.create).toHaveBeenCalledWith({
        name: 'Shortcut Folder',
        parentId: undefined
      })
    );
  });

  it('moves folders by dragging them onto another folder', async () => {
    renderSidebar();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(screen.getByText('Folder'), { dataTransfer });
    fireEvent.drop(screen.getByText('Target'), { dataTransfer });

    await waitFor(() =>
      expect(rssTnetApi.rss.folders.move).toHaveBeenCalledWith({
        folderId: 'folder-1',
        parentId: 'folder-2'
      })
    );
  });

  it('moves feeds by dragging them onto the root', async () => {
    renderSidebar();

    fireEvent.click(screen.getByText('Folder'));
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(screen.getByText('Feed (3)'), { dataTransfer });
    fireEvent.drop(screen.getByLabelText('RSS folders'), { dataTransfer });

    await waitFor(() =>
      expect(rssTnetApi.rss.feeds.move).toHaveBeenCalledWith({
        feedId: 'feed-1',
        folderId: undefined
      })
    );
  });

  it('selects feed nodes without inline feed action buttons', () => {
    renderSidebar();

    fireEvent.click(screen.getByText('Folder'));
    fireEvent.click(screen.getByText('Feed (3)'));

    expect(store.getState().rss.selectedFeedId).toBe('feed-1');
    expect(screen.queryByTitle('Sync feed')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Rename feed')).not.toBeInTheDocument();
  });

  it('opens the subscribe screen from the new feed button', () => {
    renderSidebar();

    fireEvent.click(screen.getByText('New Feed'));

    expect(store.getState().rss.isSubscribeOpen).toBe(true);
    expect(store.getState().rss.selectedFeedId).toBeUndefined();
  });

  it('shows a loading status while sidebar details are loading', () => {
    store = configureStore({ reducer: { rss: rssReducer } });
    store.dispatch(
      restoreRssFeedList({
        feeds: [
          {
            id: 'feed-1',
            title: 'Fast Feed',
            url: 'https://example.com/feed.xml',
            sortOrder: 1,
            enabled: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            unreadCount: 0
          }
        ],
        tree: {
          folders: [],
          feeds: [
            {
              kind: 'feed',
              id: 'feed-1',
              title: 'Fast Feed',
              unreadCount: 0
            }
          ]
        },
        settings: defaultRssGlobalSettings()
      })
    );

    renderSidebar();

    expect(screen.getByText('Fast Feed')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading folders and unread counts...');
  });

  const renderSidebar = (): void => {
    render(
      <Provider store={store}>
        <RssSidebar />
      </Provider>
    );
  };
});

const createDataTransfer = (): DataTransfer => {
  const data = new Map<string, string>();
  return {
    effectAllowed: 'all',
    dropEffect: 'move',
    setData: vi.fn((type: string, value: string) => data.set(type, value)),
    getData: vi.fn((type: string) => data.get(type) ?? ''),
    clearData: vi.fn((type?: string) => {
      if (type) data.delete(type);
      else data.clear();
    })
  } as unknown as DataTransfer;
};
