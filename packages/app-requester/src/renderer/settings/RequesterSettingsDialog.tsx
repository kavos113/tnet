import { useEffect, useState } from 'react';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import { normalizeRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import type { RequesterCookie } from '@tnet/app-requester/shared/requesterTypes';
import { setRequesterError, setRequesterSettings } from '../requesterSlice';
import { requesterTnetApi } from '../requesterTnetApi';
import { useRequesterDispatch, useRequesterSelector } from '../storeHooks';
import {
  RequesterCookieSettings,
  RequesterExecutionSettings,
  RequesterFontSettings,
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
            <RequesterExecutionSettings draft={draft} setDraft={setDraft} />
            <RequesterHistorySettings draft={draft} setDraft={setDraft} />
            <RequesterCookieSettings
              cookies={cookies}
              onReload={reloadCookies}
              onRemove={removeCookie}
              onClear={clearCookies}
            />
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
