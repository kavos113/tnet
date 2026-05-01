import type { SettingsFieldConfig } from '@tnet/ui/settings';
import {
  SettingsActions,
  SettingsEmptyMessage,
  SettingsFieldsSection,
  SettingsFormItem,
  SettingsIconButton,
  SettingsSecondaryButton,
  SettingsSection
} from '@tnet/ui/settings';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterCookie } from '@tnet/app-requester/shared/requesterTypes';
import styles from './RequesterSettingsSections.module.css';

type SetDraft = (draft: RequesterWorkspaceSettings) => void;

interface SettingsSectionProps {
  draft: RequesterWorkspaceSettings;
  setDraft: SetDraft;
  proxyPasswordDraft?: string;
  clientCertificatePassphraseDraft?: string;
  onProxyPasswordDraftChange?: (value: string) => void;
  onClientCertificatePassphraseDraftChange?: (value: string) => void;
}

export const RequesterExecutionSettings = ({
  draft,
  setDraft,
  proxyPasswordDraft = '',
  clientCertificatePassphraseDraft = '',
  onProxyPasswordDraftChange = () => undefined,
  onClientCertificatePassphraseDraftChange = () => undefined
}: SettingsSectionProps): React.JSX.Element => {
  const updateDraft = createDraftUpdater(draft, setDraft);

  return (
    <SettingsSection title="Execution">
      <SettingsFieldsSection
        title=""
        draft={draft}
        fields={executionFields}
        onFieldChange={updateDraft}
      />
      {!draft.validateTlsCertificates ? (
        <p className={styles.error}>
          TLS validation should stay enabled unless you are calling a trusted local service.
        </p>
      ) : null}
      <ProxySettings
        draft={draft}
        setDraft={setDraft}
        proxyPasswordDraft={proxyPasswordDraft}
        onProxyPasswordDraftChange={onProxyPasswordDraftChange}
      />
      <CertificateSettings
        draft={draft}
        setDraft={setDraft}
        clientCertificatePassphraseDraft={clientCertificatePassphraseDraft}
        onClientCertificatePassphraseDraftChange={onClientCertificatePassphraseDraftChange}
      />
    </SettingsSection>
  );
};

export const RequesterHistorySettings = ({
  draft,
  setDraft
}: SettingsSectionProps): React.JSX.Element => (
  <SettingsFieldsSection
    title="History"
    draft={draft}
    fields={historyFields}
    onFieldChange={createDraftUpdater(draft, setDraft)}
  />
);

export const RequesterFontSettings = ({
  draft,
  setDraft
}: SettingsSectionProps): React.JSX.Element => (
  <SettingsFieldsSection
    title="Fonts"
    draft={draft}
    fields={fontFields}
    onFieldChange={createDraftUpdater(draft, setDraft)}
  />
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
  <SettingsSection title="Cookies">
    <SettingsActions>
      <SettingsSecondaryButton onClick={onReload}>Reload Cookies</SettingsSecondaryButton>
      <SettingsSecondaryButton disabled={cookies.length === 0} onClick={onClear}>
        Clear Cookies
      </SettingsSecondaryButton>
    </SettingsActions>
    {cookies.length > 0 ? (
      <div className={styles.cookieList} aria-label="Workspace cookies">
        {cookies.map((cookie) => (
          <div className={styles.cookieRow} key={cookie.id}>
            <strong>{cookie.name}</strong>
            <span>{cookie.domain}</span>
            <span>{cookie.path}</span>
            <span>{cookie.expiresAt ?? 'session'}</span>
            <SettingsIconButton
              className="material-icons-round"
              aria-label={`Remove cookie ${cookie.name}`}
              onClick={() => onRemove(cookie.id)}
            >
              close
            </SettingsIconButton>
          </div>
        ))}
      </div>
    ) : (
      <SettingsEmptyMessage>No cookies stored.</SettingsEmptyMessage>
    )}
  </SettingsSection>
);

export const RequesterBackupSettings = ({
  onExport,
  onImport
}: {
  onExport: () => void;
  onImport: () => void;
}): React.JSX.Element => (
  <SettingsSection title="Backup">
    <SettingsActions>
      <SettingsSecondaryButton onClick={onExport}>Export Workspace</SettingsSecondaryButton>
      <SettingsSecondaryButton onClick={onImport}>Import Workspace</SettingsSecondaryButton>
    </SettingsActions>
  </SettingsSection>
);

const ProxySettings = ({
  draft,
  setDraft,
  proxyPasswordDraft = '',
  onProxyPasswordDraftChange = () => undefined
}: SettingsSectionProps): React.JSX.Element => {
  const updateDraft = createDraftUpdater(draft, setDraft);

  return (
    <>
      <SettingsFieldsSection
        title=""
        draft={draft}
        fields={proxyModeFields}
        onFieldChange={updateDraft}
      />
      {draft.proxyMode === 'http' || draft.proxyMode === 'socks' ? (
        <div className={styles.authFields}>
          <input
            aria-label="Proxy host"
            placeholder="Proxy host"
            value={draft.proxyHost}
            onChange={(event) => updateDraft('proxyHost', event.target.value)}
          />
          <input
            aria-label="Proxy port"
            placeholder="Port"
            type="number"
            min={1}
            value={draft.proxyPort || ''}
            onChange={(event) => updateDraft('proxyPort', Number(event.target.value))}
          />
          <input
            aria-label="Proxy username"
            placeholder="Username"
            value={draft.proxyUsername}
            onChange={(event) => updateDraft('proxyUsername', event.target.value)}
          />
          <input
            aria-label="Proxy password"
            placeholder={draft.proxyPasswordSecretId ? 'Saved proxy password' : 'Password'}
            type="password"
            value={proxyPasswordDraft}
            onChange={(event) => onProxyPasswordDraftChange(event.target.value)}
          />
        </div>
      ) : null}
    </>
  );
};

const CertificateSettings = ({
  draft,
  setDraft,
  clientCertificatePassphraseDraft = '',
  onClientCertificatePassphraseDraftChange = () => undefined
}: SettingsSectionProps): React.JSX.Element => {
  const updateDraft = createDraftUpdater(draft, setDraft);

  return (
    <>
      <SettingsFormItem htmlFor="requester-client-certificate" label="Client certificate path">
        <input
          id="requester-client-certificate"
          value={draft.clientCertificatePath}
          onChange={(event) => updateDraft('clientCertificatePath', event.target.value)}
        />
      </SettingsFormItem>
      <SettingsFormItem
        htmlFor="requester-client-certificate-key"
        label="Client certificate key path"
      >
        <input
          id="requester-client-certificate-key"
          value={draft.clientCertificateKeyPath}
          onChange={(event) => updateDraft('clientCertificateKeyPath', event.target.value)}
        />
      </SettingsFormItem>
      <SettingsFormItem
        htmlFor="requester-custom-ca-certificate"
        label="Custom CA certificate path"
      >
        <input
          id="requester-custom-ca-certificate"
          value={draft.customCaCertificatePath}
          onChange={(event) => updateDraft('customCaCertificatePath', event.target.value)}
        />
      </SettingsFormItem>
      <SettingsFormItem
        htmlFor="requester-client-certificate-passphrase"
        label="Client certificate passphrase"
      >
        <input
          id="requester-client-certificate-passphrase"
          aria-label="Client certificate passphrase"
          type="password"
          placeholder={
            draft.clientCertificatePassphraseSecretId
              ? 'Saved certificate passphrase'
              : 'Passphrase'
          }
          value={clientCertificatePassphraseDraft}
          onChange={(event) => onClientCertificatePassphraseDraftChange(event.target.value)}
        />
      </SettingsFormItem>
    </>
  );
};

const createDraftUpdater =
  (draft: RequesterWorkspaceSettings, setDraft: SetDraft) =>
  <Key extends keyof RequesterWorkspaceSettings>(
    key: Key,
    value: RequesterWorkspaceSettings[Key]
  ): void => {
    setDraft({
      ...draft,
      [key]: value
    });
  };

const executionFields: ReadonlyArray<SettingsFieldConfig<RequesterWorkspaceSettings>> = [
  {
    id: 'requester-timeout-ms',
    label: 'Request timeout (ms)',
    key: 'requestTimeoutMs',
    type: 'number',
    min: 1,
    step: 1000
  },
  {
    id: 'requester-follow-redirects',
    label: 'Follow redirects',
    key: 'followRedirects',
    type: 'checkbox'
  },
  {
    id: 'requester-validate-tls',
    label: 'Validate TLS certificates',
    key: 'validateTlsCertificates',
    type: 'checkbox'
  },
  {
    id: 'requester-cookie-jar-enabled',
    label: 'Use workspace cookie jar',
    key: 'cookieJarEnabled',
    type: 'checkbox'
  }
];

const proxyModeFields: ReadonlyArray<SettingsFieldConfig<RequesterWorkspaceSettings>> = [
  {
    id: 'requester-proxy-mode',
    label: 'Proxy mode',
    key: 'proxyMode',
    type: 'select',
    options: [
      { value: 'system', label: 'system' },
      { value: 'none', label: 'none' },
      { value: 'http', label: 'http' },
      { value: 'socks', label: 'socks' }
    ]
  }
];

const historyFields: ReadonlyArray<SettingsFieldConfig<RequesterWorkspaceSettings>> = [
  {
    id: 'requester-history-enabled',
    label: 'Save request history',
    key: 'historyEnabled',
    type: 'checkbox'
  },
  {
    id: 'requester-save-response-body',
    label: 'Save response body previews',
    key: 'saveResponseBody',
    type: 'checkbox'
  }
];

const fontFields: ReadonlyArray<SettingsFieldConfig<RequesterWorkspaceSettings>> = [
  {
    id: 'requester-code-font-family',
    label: 'Code font family',
    key: 'codeFontFamily',
    type: 'text'
  },
  {
    id: 'requester-code-font-size',
    label: 'Code font size (px)',
    key: 'codeFontSize',
    type: 'number',
    min: 1
  },
  {
    id: 'requester-app-font-family',
    label: 'App font family',
    key: 'appFontFamily',
    type: 'text'
  },
  {
    id: 'requester-app-font-size',
    label: 'App font size (px)',
    key: 'appFontSize',
    type: 'number',
    min: 1
  }
];
