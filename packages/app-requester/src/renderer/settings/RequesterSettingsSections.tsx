import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterCookie } from '@tnet/app-requester/shared/requesterTypes';

type SetDraft = (draft: RequesterWorkspaceSettings) => void;

interface SettingsSectionProps {
  draft: RequesterWorkspaceSettings;
  setDraft: SetDraft;
}

export const RequesterExecutionSettings = ({
  draft,
  setDraft
}: SettingsSectionProps): React.JSX.Element => (
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
    <ProxySettings draft={draft} setDraft={setDraft} />
    <CertificateSettings draft={draft} setDraft={setDraft} />
  </div>
);

export const RequesterHistorySettings = ({
  draft,
  setDraft
}: SettingsSectionProps): React.JSX.Element => (
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
);

export const RequesterFontSettings = ({
  draft,
  setDraft
}: SettingsSectionProps): React.JSX.Element => (
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
);

export const RequesterCookieSettings = ({
  cookies,
  onReload,
  onRemove,
  onClear
}: {
  cookies: RequesterCookie[];
  onReload: () => void;
  onRemove: (cookieId: string) => void;
  onClear: () => void;
}): React.JSX.Element => (
  <div className="settings-group">
    <h3>Cookies</h3>
    <div className="requester-cookie-actions">
      <button type="button" className="settings-close-button" onClick={onReload}>
        Reload Cookies
      </button>
      <button
        type="button"
        className="settings-close-button"
        disabled={cookies.length === 0}
        onClick={onClear}
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
              onClick={() => onRemove(cookie.id)}
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
);

const ProxySettings = ({ draft, setDraft }: SettingsSectionProps): React.JSX.Element => (
  <>
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
  </>
);

const CertificateSettings = ({ draft, setDraft }: SettingsSectionProps): React.JSX.Element => (
  <>
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
  </>
);
