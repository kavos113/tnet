import { useEffect, useState } from 'react';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import { normalizeRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterCookie } from '@tnet/app-requester/shared/requesterTypes';
import { setRequesterError, setRequesterSettings, setRequesterWorkspace } from '../requesterSlice';
import { requesterTnetApi } from '../requesterTnetApi';
import { useRequesterDispatch, useRequesterSelector } from '../storeHooks';
import {
  RequesterCookieSettings,
  RequesterExecutionSettings,
  RequesterFontSettings,
  RequesterBackupSettings,
  RequesterHistorySettings
} from './RequesterSettingsSections';

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
  const [proxyPasswordDraft, setProxyPasswordDraft] = useState('');
  const [clientCertificatePassphraseDraft, setClientCertificatePassphraseDraft] = useState('');
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
        if (!canceled) {
          setProxyPasswordDraft('');
          setClientCertificatePassphraseDraft('');
        }
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

  const exportWorkspace = (): void => {
    if (!activeWorkspaceId) return;
    requesterTnetApi.requester.backup
      .exportWorkspace({ workspaceId: activeWorkspaceId })
      .catch((error: unknown) => {
        console.error('Failed to export requester workspace', error);
        dispatch(setRequesterError('Failed to export requester workspace.'));
      });
  };

  const importWorkspace = (): void => {
    requesterTnetApi.requester.backup
      .importWorkspace()
      .then(async (result) => {
        if (!result) return;
        const [workspaces, requests, settings, history] = await Promise.all([
          requesterTnetApi.requester.workspaces.list(),
          requesterTnetApi.requester.requests.list({ workspaceId: result.workspaceId }),
          requesterTnetApi.requester.workspaces.getSettings({ workspaceId: result.workspaceId }),
          requesterTnetApi.requester.history.list({ workspaceId: result.workspaceId })
        ]);
        dispatch(
          setRequesterWorkspace({
            activeWorkspaceId: result.workspaceId,
            workspaces,
            requests,
            settings,
            history
          })
        );
        onClose();
      })
      .catch((error: unknown) => {
        console.error('Failed to import requester workspace', error);
        dispatch(setRequesterError('Failed to import requester workspace.'));
      });
  };

  const save = (): void => {
    if (!activeWorkspaceId) return;
    saveSettings().catch((error: unknown) => {
      console.error('Failed to save requester settings', error);
      dispatch(setRequesterError('Failed to save requester settings.'));
    });
  };

  const saveSettings = async (): Promise<void> => {
    if (!activeWorkspaceId) return;
    const nextDraft = { ...draft };
    if (proxyPasswordDraft) {
      const { secretId } = await requesterTnetApi.requester.secrets.save({
        value: proxyPasswordDraft
      });
      nextDraft.proxyPasswordSecretId = secretId;
    }
    if (clientCertificatePassphraseDraft) {
      const { secretId } = await requesterTnetApi.requester.secrets.save({
        value: clientCertificatePassphraseDraft
      });
      nextDraft.clientCertificatePassphraseSecretId = secretId;
    }
    const normalizedDraft = normalizeRequesterWorkspaceSettings(nextDraft);
    await requesterTnetApi.requester.workspaces.saveSettings({
      workspaceId: activeWorkspaceId,
      settings: normalizedDraft
    });
    dispatch(setRequesterSettings(normalizedDraft));
    onClose();
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
            <RequesterExecutionSettings
              draft={draft}
              setDraft={setDraft}
              proxyPasswordDraft={proxyPasswordDraft}
              clientCertificatePassphraseDraft={clientCertificatePassphraseDraft}
              onProxyPasswordDraftChange={setProxyPasswordDraft}
              onClientCertificatePassphraseDraftChange={setClientCertificatePassphraseDraft}
            />
            <RequesterHistorySettings draft={draft} setDraft={setDraft} />
            <RequesterCookieSettings
              cookies={cookies}
              onReload={reloadCookies}
              onRemove={removeCookie}
              onClear={clearCookies}
            />
            <RequesterBackupSettings onExport={exportWorkspace} onImport={importWorkspace} />
            <RequesterFontSettings draft={draft} setDraft={setDraft} />
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
