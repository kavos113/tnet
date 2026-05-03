import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSettingsDraft } from './useSettingsDraft';

describe('useSettingsDraft', () => {
  afterEach(() => cleanup());

  it('loads and normalizes the draft', async () => {
    const { result } = renderHook(() =>
      useSettingsDraft({
        initialDraft: { count: 1 },
        load: () => Promise.resolve({ count: -1 }),
        normalize: (draft) => ({ count: Math.max(draft.count, 0) })
      })
    );

    await waitFor(() => expect(result.current.draft.count).toBe(0));
  });

  it('updates draft values through the normalizer', async () => {
    const { result } = renderHook(() =>
      useSettingsDraft({
        initialDraft: { label: 'initial', count: 1 },
        load: () => Promise.resolve({ label: 'loaded', count: 1 }),
        normalize: (draft) => ({ ...draft, count: Math.max(draft.count, 0) })
      })
    );

    await waitFor(() => expect(result.current.draft.label).toBe('loaded'));

    act(() => {
      result.current.updateDraft('count', -10);
    });

    await waitFor(() => expect(result.current.draft.count).toBe(0));
  });

  it('falls back to the initial draft on load errors', async () => {
    const onLoadError = vi.fn();
    const { result } = renderHook(() =>
      useSettingsDraft({
        initialDraft: { enabled: true },
        load: () => Promise.reject(new Error('failed')),
        onLoadError
      })
    );

    await waitFor(() => expect(onLoadError).toHaveBeenCalledTimes(1));
    expect(result.current.draft).toEqual({ enabled: true });
  });
});
