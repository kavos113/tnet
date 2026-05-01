import { useEffect, useState } from 'react';
import { SettingsDialogShell } from '@tnet/ui/settings';
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

  const save = async (): Promise<void> => {
    if (!activeWorkspaceId) return;
    await saveSettings();
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
  };

  return (
    <SettingsDialogShell
      isOpen={isOpen}
      onClose={onClose}
      title="Requester Settings"
      ariaLabel="Requester settings"
      saveLabel="Save Settings"
      unavailableMessage={
        !activeWorkspaceId ? 'Create a request workspace before editing settings.' : undefined
      }
      isSaveDisabled={!activeWorkspaceId}
      onSave={save}
      onSaveError={(error) => {
        console.error('Failed to save requester settings', error);
        dispatch(setRequesterError('Failed to save requester settings.'));
      }}
    >
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
    </SettingsDialogShell>
  );
};
