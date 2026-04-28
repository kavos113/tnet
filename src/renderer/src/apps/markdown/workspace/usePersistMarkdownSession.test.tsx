import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@renderer/app/store';
import { openFile, setViewMode, splitActiveTabRight } from '@renderer/features/editor/editorSlice';
import { setWorkspace } from '@renderer/features/workspace/workspaceSlice';
import { usePersistMarkdownSession } from './usePersistMarkdownSession';

const sessionSave = vi.fn();

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      session: {
        save: sessionSave
      }
    },
    writable: true
  });
};

const PersistSessionProbe = (): null => {
  usePersistMarkdownSession({ enabled: true, debounceMs: 10 });
  return null;
};

describe('usePersistMarkdownSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionSave.mockReset();
    sessionSave.mockResolvedValue(undefined);
    installTnetApi();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists split editor groups in the markdown workspace session layout', () => {
    const store = createAppStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(openFile({ path: '/workspace/note.md', content: '# Note' }));
    store.dispatch(splitActiveTabRight());
    store.dispatch(setViewMode({ groupId: 'secondary', viewMode: 'preview' }));

    render(
      <Provider store={store}>
        <PersistSessionProbe />
      </Provider>
    );

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(sessionSave).toHaveBeenCalledWith(
      '/workspace',
      expect.objectContaining({
        openedFiles: ['/workspace/note.md'],
        editorLayout: expect.objectContaining({
          activeGroupId: 'secondary',
          isSecondaryGroupVisible: true,
          groups: {
            primary: expect.objectContaining({
              openedFiles: ['/workspace/note.md'],
              viewMode: 'split'
            }),
            secondary: expect.objectContaining({
              openedFiles: ['/workspace/note.md'],
              viewMode: 'preview'
            })
          }
        })
      })
    );
  });
});
