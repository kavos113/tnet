import { useEffect, useState } from 'react';
import type { RequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
import { normalizeRequesterWorkspaceSettings } from '@tnet/app-requester/shared/config';
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

  useEffect(() => {
    if (!isOpen) return;
    if (!activeWorkspaceId) {
      setDraft(settings);
      return;
    }

    let canceled = false;
    requesterTnetApi.requester.workspaces
      .getSettings({ workspaceId: activeWorkspaceId })
      .then((loadedSettings) => {
        if (!canceled) setDraft(loadedSettings);
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
