import { describe, expect, it, vi } from 'vitest';
import { loadPopupState } from '../src/popup/popupStore';

describe('loadPopupState', () => {
  it('shows retryable unavailable state when backend is not running', async () => {
    const client = {
      checkHealth: vi.fn(async () => false)
    };

    await expect(
      loadPopupState(client as never, { sourceUrl: 'https://example.test' })
    ).resolves.toMatchObject({
      status: 'server-unavailable',
      errorMessage: 'TNet desktop app is not running.'
    });
  });

  it('loads libraries and normalized metadata when backend is available', async () => {
    const client = {
      checkHealth: vi.fn(async () => true),
      listLibraries: vi.fn(async () => ({
        libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
        activeLibraryRoot: 'C:/papers'
      })),
      resolveMetadata: vi.fn(async () => ({ title: 'Paper' }))
    };

    await expect(
      loadPopupState(client as never, { sourceUrl: 'https://example.test' })
    ).resolves.toMatchObject({
      status: 'ready',
      libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
      activeLibraryRoot: 'C:/papers',
      candidate: { title: 'Paper' }
    });
  });
});
