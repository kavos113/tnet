import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import requesterReducer, { restoreRequester } from '../requesterSlice';
import { RequesterSettingsDialog } from './RequesterSettingsDialog';

const getSettings = vi.fn();
const saveSettings = vi.fn();

interface RequesterTestState {
  requester: ReturnType<typeof requesterReducer>;
}

const createStore = (): EnhancedStore<RequesterTestState> =>
  configureStore({
    reducer: {
      requester: requesterReducer
    }
  });

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      requester: {
        workspaces: {
          getSettings,
          saveSettings
        }
      }
    },
    writable: true
  });
};

describe('RequesterSettingsDialog', () => {
  beforeEach(() => {
    installTnetApi();
    getSettings.mockResolvedValue(defaultRequesterWorkspaceSettings());
    saveSettings.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads workspace settings into a draft and saves edited values', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        settings: defaultRequesterWorkspaceSettings()
      })
    );
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <RequesterSettingsDialog isOpen={true} onClose={onClose} />
      </Provider>
    );

    await waitFor(() => expect(getSettings).toHaveBeenCalledWith({ workspaceId: 'workspace-1' }));

    fireEvent.change(screen.getByLabelText('Request timeout (ms)'), {
      target: { value: '12000' }
    });
    fireEvent.click(screen.getByLabelText('Follow redirects'));
    fireEvent.click(screen.getByLabelText('Validate TLS certificates'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        settings: expect.objectContaining({
          requestTimeoutMs: 12000,
          followRedirects: false,
          validateTlsCertificates: false
        })
      })
    );
    expect(store.getState().requester.settings).toEqual(
      expect.objectContaining({
        requestTimeoutMs: 12000,
        followRedirects: false,
        validateTlsCertificates: false
      })
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
