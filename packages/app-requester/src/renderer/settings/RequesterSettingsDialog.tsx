import { useEffect, useState } from 'react';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import { normalizeRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterCookie } from '@tnet/app-requester/shared/requesterTypes';
import { setRequesterError, setRequesterSettings } from '../requesterSlice';
import { requesterTnetApi } from '../requesterTnetApi';
import { useRequesterDispatch, useRequesterSelector } from '../storeHooks';

interface RequesterSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequesterSettingsDialog = ({
  isOpen,
  onClose
}: RequesterSettingsDialogProps): React.JSX.Element | null => {
  const dispatch = useRequesterDispatch();
  const activeWorkspaceId = useRequesterSelector((state) => state.requester.activeWorkspaceId);
  const settings = useRequesterSelector((state) => state.requester.settings);
  const [draft, setDraft] = useState<RequesterWorkspaceSettings>(settings);
  const [cookies, setCookies] = useState<RequesterCookie[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (!activeWorkspaceId) {
      setDraft(settings);
      return;
    }

    let canceled = false;
    Promise.all([
      requesterTnetApi.requester.workspaces.getSettings({ workspaceId: activeWorkspaceId }),
      requesterTnetApi.requester.cookies.list({ workspaceId: activeWorkspaceId })
    ])
      .then(([loadedSettings, loadedCookies]) => {
        if (!canceled) setDraft(loadedSettings);
        if (!canceled) setCookies(loadedCookies);
      })
      .catch((error: unknown) => {
        console.error('Failed to load requester settings', error);
        if (!canceled) setDraft(settings);
      });

    return () => {
      canceled = true;
    };
  }, [activeWorkspaceId, isOpen, settings]);

  if (!isOpen) return null;

  const reloadCookies = (): void => {
    if (!activeWorkspaceId) return;
    requesterTnetApi.requester.cookies
      .list({ workspaceId: activeWorkspaceId })
      .then(setCookies)
      .catch((error: unknown) => {
        console.error('Failed to load requester cookies', error);
        dispatch(setRequesterError('Failed to load requester cookies.'));
      });
  };

  const removeCookie = (cookieId: string): void => {
    requesterTnetApi.requester.cookies
      .remove({ cookieId })
      .then(reloadCookies)
      .catch((error: unknown) => {
        console.error('Failed to remove requester cookie', error);
        dispatch(setRequesterError('Failed to remove requester cookie.'));
      });
  };

  const clearCookies = (): void => {
    if (!activeWorkspaceId) return;
    requesterTnetApi.requester.cookies
      .clear({ workspaceId: activeWorkspaceId })
      .then(() => setCookies([]))
      .catch((error: unknown) => {
        console.error('Failed to clear requester cookies', error);
        dispatch(setRequesterError('Failed to clear requester cookies.'));
      });
  };

  const save = (): void => {
    if (!activeWorkspaceId) return;
    const normalizedDraft = normalizeRequesterWorkspaceSettings(draft);
    requesterTnetApi.requester.workspaces
      .saveSettings({
        workspaceId: activeWorkspaceId,
        settings: normalizedDraft
      })
      .then(() => {
        dispatch(setRequesterSettings(normalizedDraft));
        onClose();
      })
      .catch((error: unknown) => {
        console.error('Failed to save requester settings', error);
        dispatch(setRequesterError('Failed to save requester settings.'));
      });
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className="modal-content"
        aria-label="Requester settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Requester Settings</h2>
        {!activeWorkspaceId ? (
          <div className="empty-list-message">
            Create a request workspace before editing settings.
          </div>
        ) : (
          <>
            <div className="settings-group">
              <h3>Execution</h3>
              <label className="form-item" htmlFor="requester-timeout-ms">
                <span>Request timeout (ms)</span>
                <input
                  id="requester-timeout-ms"
                  type="number"
                  min={1}
                  step={1000}
                  value={draft.requestTimeoutMs}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      requestTimeoutMs: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label className="form-item form-item-inline" htmlFor="requester-follow-redirects">
                <span>Follow redirects</span>
                <input
                  id="requester-follow-redirects"
                  type="checkbox"
                  checked={draft.followRedirects}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      followRedirects: event.target.checked
                    })
                  }
                />
              </label>
              <label className="form-item form-item-inline" htmlFor="requester-validate-tls">
                <span>Validate TLS certificates</span>
                <input
                  id="requester-validate-tls"
                  type="checkbox"
                  checked={draft.validateTlsCertificates}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      validateTlsCertificates: event.target.checked
                    })
                  }
                />
              </label>
              {!draft.validateTlsCertificates ? (
                <p className="requester-error">
                  TLS validation should stay enabled unless you are calling a trusted local service.
                </p>
              ) : null}
              <label className="form-item form-item-inline" htmlFor="requester-cookie-jar-enabled">
                <span>Use workspace cookie jar</span>
                <input
                  id="requester-cookie-jar-enabled"
                  type="checkbox"
                  checked={draft.cookieJarEnabled}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      cookieJarEnabled: event.target.checked
                    })
                  }
                />
              </label>
              <label className="form-item" htmlFor="requester-proxy-mode">
                <span>Proxy mode</span>
                <select
                  id="requester-proxy-mode"
                  value={draft.proxyMode}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      proxyMode: event.target.value as RequesterWorkspaceSettings['proxyMode']
                    })
                  }
                >
                  <option value="system">system</option>
                  <option value="none">none</option>
                  <option value="http">http</option>
                  <option value="socks">socks</option>
                </select>
              </label>
              {draft.proxyMode === 'http' || draft.proxyMode === 'socks' ? (
                <div className="requester-auth-fields">
                  <input
                    aria-label="Proxy host"
                    placeholder="Proxy host"
                    value={draft.proxyHost}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        proxyHost: event.target.value
                      })
                    }
                  />
                  <input
                    aria-label="Proxy port"
                    placeholder="Port"
                    type="number"
                    min={1}
                    value={draft.proxyPort || ''}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        proxyPort: Number(event.target.value)
                      })
                    }
                  />
                  <input
                    aria-label="Proxy username"
                    placeholder="Username"
                    value={draft.proxyUsername}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        proxyUsername: event.target.value
                      })
                    }
                  />
                </div>
              ) : null}
              <label className="form-item" htmlFor="requester-client-certificate">
                <span>Client certificate path</span>
                <input
                  id="requester-client-certificate"
                  value={draft.clientCertificatePath}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      clientCertificatePath: event.target.value
                    })
                  }
                />
              </label>
              <label className="form-item" htmlFor="requester-client-certificate-key">
                <span>Client certificate key path</span>
                <input
                  id="requester-client-certificate-key"
                  value={draft.clientCertificateKeyPath}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      clientCertificateKeyPath: event.target.value
                    })
                  }
                />
              </label>
              <label className="form-item" htmlFor="requester-custom-ca-certificate">
                <span>Custom CA certificate path</span>
                <input
                  id="requester-custom-ca-certificate"
                  value={draft.customCaCertificatePath}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      customCaCertificatePath: event.target.value
                    })
                  }
                />
              </label>
            </div>
            <div className="settings-group">
              <h3>History</h3>
              <label className="form-item form-item-inline" htmlFor="requester-history-enabled">
                <span>Save request history</span>
                <input
                  id="requester-history-enabled"
                  type="checkbox"
                  checked={draft.historyEnabled}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      historyEnabled: event.target.checked
                    })
                  }
                />
              </label>
              <label className="form-item form-item-inline" htmlFor="requester-save-response-body">
                <span>Save response body previews</span>
                <input
                  id="requester-save-response-body"
                  type="checkbox"
                  checked={draft.saveResponseBody}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      saveResponseBody: event.target.checked
                    })
                  }
                />
              </label>
            </div>
            <div className="settings-group">
              <h3>Cookies</h3>
              <div className="requester-cookie-actions">
                <button type="button" className="settings-close-button" onClick={reloadCookies}>
                  Reload Cookies
                </button>
                <button
                  type="button"
                  className="settings-close-button"
                  disabled={cookies.length === 0}
                  onClick={clearCookies}
                >
                  Clear Cookies
                </button>
              </div>
              {cookies.length > 0 ? (
                <div className="requester-cookie-list" aria-label="Workspace cookies">
                  {cookies.map((cookie) => (
                    <div className="requester-cookie-row" key={cookie.id}>
                      <strong>{cookie.name}</strong>
                      <span>{cookie.domain}</span>
                      <span>{cookie.path}</span>
                      <span>{cookie.expiresAt ?? 'session'}</span>
                      <button
                        type="button"
                        className="sidebar-icon-button material-icons-round"
                        aria-label={`Remove cookie ${cookie.name}`}
                        onClick={() => removeCookie(cookie.id)}
                      >
                        close
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-list-message">No cookies stored.</p>
              )}
            </div>
            <div className="settings-group">
              <h3>Fonts</h3>
              <label className="form-item" htmlFor="requester-code-font-family">
                <span>Code font family</span>
                <input
                  id="requester-code-font-family"
                  value={draft.codeFontFamily}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      codeFontFamily: event.target.value
                    })
                  }
                />
              </label>
              <label className="form-item" htmlFor="requester-code-font-size">
                <span>Code font size (px)</span>
                <input
                  id="requester-code-font-size"
                  type="number"
                  min={1}
                  value={draft.codeFontSize}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      codeFontSize: Number(event.target.value)
                    })
                  }
                />
              </label>
              <label className="form-item" htmlFor="requester-app-font-family">
                <span>App font family</span>
                <input
                  id="requester-app-font-family"
                  value={draft.appFontFamily}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      appFontFamily: event.target.value
                    })
                  }
                />
              </label>
              <label className="form-item" htmlFor="requester-app-font-size">
                <span>App font size (px)</span>
                <input
                  id="requester-app-font-size"
                  type="number"
                  min={1}
                  value={draft.appFontSize}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      appFontSize: Number(event.target.value)
                    })
                  }
                />
              </label>
            </div>
            <footer className="modal-actions">
              <button type="button" className="settings-close-button" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="open-folder-button" onClick={save}>
                Save Settings
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
};
