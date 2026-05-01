import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import requesterReducer, { restoreRequester } from '../requesterSlice';
import { RequesterSettingsDialog } from './RequesterSettingsDialog';

const getSettings = vi.fn();
const listWorkspaces = vi.fn();
const listRequests = vi.fn();
const listHistory = vi.fn();
const saveSettings = vi.fn();
const listCookies = vi.fn();
const removeCookie = vi.fn();
const clearCookies = vi.fn();
const saveSecret = vi.fn();
const exportWorkspace = vi.fn();
const importWorkspace = vi.fn();

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
          list: listWorkspaces,
          getSettings,
          saveSettings
        },
        requests: {
          list: listRequests
        },
        history: {
          list: listHistory
        },
        cookies: {
          list: listCookies,
          remove: removeCookie,
          clear: clearCookies
        },
        secrets: {
          save: saveSecret
        },
        backup: {
          exportWorkspace,
          importWorkspace
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
    listWorkspaces.mockResolvedValue([{ id: 'workspace-1', name: 'Local' }]);
    listRequests.mockResolvedValue([]);
    listHistory.mockResolvedValue([]);
    saveSettings.mockResolvedValue(undefined);
    listCookies.mockResolvedValue([]);
    removeCookie.mockResolvedValue(undefined);
    clearCookies.mockResolvedValue(undefined);
    saveSecret.mockImplementation(async ({ value }: { value: string }) => ({
      secretId: value.includes('cert') ? 'secret-cert' : 'secret-proxy'
    }));
    exportWorkspace.mockResolvedValue('backup.json');
    importWorkspace.mockResolvedValue(null);
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
    expect(listCookies).toHaveBeenCalledWith({ workspaceId: 'workspace-1' });

    fireEvent.change(screen.getByLabelText('Request timeout (ms)'), {
      target: { value: '12000' }
    });
    fireEvent.click(screen.getByLabelText('Follow redirects'));
    fireEvent.click(screen.getByLabelText('Validate TLS certificates'));
    fireEvent.click(screen.getByLabelText('Use workspace cookie jar'));
    fireEvent.change(screen.getByLabelText('Proxy mode'), { target: { value: 'http' } });
    fireEvent.change(screen.getByLabelText('Proxy host'), { target: { value: 'proxy.test' } });
    fireEvent.change(screen.getByLabelText('Proxy port'), { target: { value: '8080' } });
    fireEvent.change(screen.getByLabelText('Proxy username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Proxy password'), {
      target: { value: 'proxy-password' }
    });
    fireEvent.change(screen.getByLabelText('Client certificate path'), {
      target: { value: 'C:\\certs\\client.crt' }
    });
    fireEvent.change(screen.getByLabelText('Client certificate key path'), {
      target: { value: 'C:\\certs\\client.key' }
    });
    fireEvent.change(screen.getByLabelText('Custom CA certificate path'), {
      target: { value: 'C:\\certs\\ca.crt' }
    });
    fireEvent.change(screen.getByLabelText('Client certificate passphrase'), {
      target: { value: 'cert-passphrase' }
    });
    fireEvent.change(screen.getByLabelText('Code font family'), {
      target: { value: 'Code Font' }
    });
    fireEvent.change(screen.getByLabelText('Code font size (px)'), {
      target: { value: '15' }
    });
    fireEvent.change(screen.getByLabelText('App font family'), {
      target: { value: 'UI Font' }
    });
    fireEvent.change(screen.getByLabelText('App font size (px)'), {
      target: { value: '14' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    await waitFor(() =>
      expect(saveSettings).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        settings: expect.objectContaining({
          requestTimeoutMs: 12000,
          followRedirects: false,
          validateTlsCertificates: false,
          cookieJarEnabled: true,
          proxyMode: 'http',
          proxyHost: 'proxy.test',
          proxyPort: 8080,
          proxyUsername: 'testuser',
          proxyPasswordSecretId: 'secret-proxy',
          clientCertificatePath: 'C:\\certs\\client.crt',
          clientCertificateKeyPath: 'C:\\certs\\client.key',
          clientCertificatePassphraseSecretId: 'secret-cert',
          customCaCertificatePath: 'C:\\certs\\ca.crt',
          codeFontFamily: 'Code Font',
          codeFontSize: 15,
          appFontFamily: 'UI Font',
          appFontSize: 14
        })
      })
    );
    expect(store.getState().requester.settings).toEqual(
      expect.objectContaining({
        requestTimeoutMs: 12000,
        followRedirects: false,
        validateTlsCertificates: false,
        cookieJarEnabled: true,
        proxyMode: 'http',
        proxyHost: 'proxy.test',
        proxyPort: 8080,
        proxyUsername: 'testuser',
        proxyPasswordSecretId: 'secret-proxy',
        clientCertificatePath: 'C:\\certs\\client.crt',
        clientCertificateKeyPath: 'C:\\certs\\client.key',
        clientCertificatePassphraseSecretId: 'secret-cert',
        customCaCertificatePath: 'C:\\certs\\ca.crt',
        codeFontFamily: 'Code Font',
        codeFontSize: 15,
        appFontFamily: 'UI Font',
        appFontSize: 14
      })
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('lists, removes, and clears workspace cookies', async () => {
    const store = createStore();
    store.dispatch(
      restoreRequester({
        activeWorkspaceId: 'workspace-1',
        workspaces: [{ id: 'workspace-1', name: 'Local' }],
        settings: defaultRequesterWorkspaceSettings()
      })
    );
    listCookies.mockResolvedValueOnce([
      {
        id: 'cookie-1',
        workspaceId: 'workspace-1',
        name: 'session',
        value: 'abc',
        domain: 'example.test',
        path: '/',
        secure: true,
        httpOnly: true,
        hostOnly: true,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ]);
    listCookies.mockResolvedValueOnce([]);
    const onClose = vi.fn();

    render(
      <Provider store={store}>
        <RequesterSettingsDialog isOpen={true} onClose={onClose} />
      </Provider>
    );

    expect((await screen.findAllByText('session'))[0]).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove cookie session'));

    await waitFor(() => expect(removeCookie).toHaveBeenCalledWith({ cookieId: 'cookie-1' }));
    await waitFor(() => expect(screen.getByText('No cookies stored.')).toBeInTheDocument());

    listCookies.mockResolvedValueOnce([
      {
        id: 'cookie-2',
        workspaceId: 'workspace-1',
        name: 'theme',
        value: 'dark',
        domain: 'example.test',
        path: '/',
        secure: false,
        httpOnly: false,
        hostOnly: true,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      }
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Reload Cookies' }));
    expect(await screen.findByText('theme')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Cookies' }));

    await waitFor(() => expect(clearCookies).toHaveBeenCalledWith({ workspaceId: 'workspace-1' }));
    expect(screen.getByText('No cookies stored.')).toBeInTheDocument();
  });
});
