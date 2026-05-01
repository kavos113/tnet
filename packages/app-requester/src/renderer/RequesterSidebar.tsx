import { useState } from 'react';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import {
  setActiveRequesterFolder,
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterHistory,
  setRequesterRequests,
  setRequesterResponse,
  setRequesterResponseError,
  setRequesterSettings,
  setRequesterWorkspace
} from './requesterSlice';
import {
  buildRequesterExplorerTree,
  normalizeRequestFolderPath,
  normalizeRequestPath,
  requestFolderFromPath
} from '@tnet/app-requester/shared/requestPath';
import { requesterTnetApi } from './requesterTnetApi';
import { RequesterRequestTree } from './RequesterRequestTree';
import { RequesterRenameDialog } from './sidebar/RequesterRenameDialog';
import { RequesterWorkspaceSwitcher } from './sidebar/RequesterWorkspaceSwitcher';
import sharedStyles from './RequesterShared.module.css';
import { toExecutionErrorSnapshot } from './request/requesterAppHelpers';
import { useRequesterDispatch, useRequesterSelector } from './storeHooks';

interface NewFolderState {
  isActive: boolean;
  parentPath?: string;
  name: string;
}

interface RenameRequestState {
  isActive: boolean;
  requestId?: string;
  name: string;
  folderPath: string;
}

const emptyNewFolder: NewFolderState = {
  isActive: false,
  name: ''
};

const emptyRenameRequest: RenameRequestState = {
  isActive: false,
  name: '',
  folderPath: ''
};

export const RequesterSidebar = (): React.JSX.Element => {
  const dispatch = useRequesterDispatch();
  const [newFolder, setNewFolder] = useState<NewFolderState>(emptyNewFolder);
  const [renameRequest, setRenameRequest] = useState<RenameRequestState>(emptyRenameRequest);
  const activeFolderPath = useRequesterSelector((state) => state.requester.activeRequestFolderPath);
  const activeWorkspaceId = useRequesterSelector((state) => state.requester.activeWorkspaceId);
  const activeRequestId = useRequesterSelector((state) => state.requester.activeRequestId);
  const requests = useRequesterSelector((state) => state.requester.requests);
  const settings = useRequesterSelector((state) => state.requester.settings);
  const workspaces = useRequesterSelector((state) => state.requester.workspaces);
  const requestTree = buildRequesterExplorerTree(requests, settings.requestFolderPaths);
  const shouldShowNewFolderAtRoot =
    newFolder.isActive && !newFolder.parentPath && Boolean(activeWorkspaceId);
  const renameRequestPathPreview = renameRequest.isActive
    ? normalizeRequestPath(
        renameRequest.folderPath
          ? `${renameRequest.folderPath}/${renameRequest.name}`
          : renameRequest.name
      )
    : '';

  const activateWorkspace = async (workspaceId: string): Promise<void> => {
    const [latestWorkspaces, latestRequests, settings, history] = await Promise.all([
      requesterTnetApi.requester.workspaces.list(),
      requesterTnetApi.requester.requests.list({ workspaceId }),
      requesterTnetApi.requester.workspaces.getSettings({ workspaceId }),
      requesterTnetApi.requester.history.list({ workspaceId })
    ]);
    await requesterTnetApi.requester.config.saveGlobal({
      activeWorkspaceId: workspaceId,
      lastOpenedWorkspaceId: workspaceId
    });
    dispatch(
      setRequesterWorkspace({
        activeWorkspaceId: workspaceId,
        workspaces: latestWorkspaces,
        requests: latestRequests,
        history,
        settings
      })
    );
  };

  const createWorkspace = async (): Promise<void> => {
    const workspace = await requesterTnetApi.requester.workspaces.create({
      name: `Workspace ${workspaces.length + 1}`
    });
    await activateWorkspace(workspace.id);
  };

  const createRequest = async (): Promise<void> => {
    if (!activeWorkspaceId) return;
    const requestName = `Request ${requests.length + 1}`;
    const requestPath = normalizeRequestPath(
      activeFolderPath ? `${activeFolderPath}/${requestName}` : requestName
    );
    const request = await requesterTnetApi.requester.requests.save({
      workspaceId: activeWorkspaceId,
      name: requestName,
      requestPath,
      method: 'GET',
      url: ''
    });
    const latestRequests = await requesterTnetApi.requester.requests.list({
      workspaceId: activeWorkspaceId
    });
    dispatch(
      setRequesterWorkspace({
        activeWorkspaceId,
        workspaces,
        requests: latestRequests,
        settings
      })
    );
    dispatch(setActiveRequesterRequest(request));
    dispatch(setActiveRequesterFolder(requestFolderFromPath(request.requestPath)));
  };

  const startNewFolder = (): void => {
    if (!activeWorkspaceId) return;
    const parentPath = activeFolderPath;
    setNewFolder({
      isActive: true,
      parentPath,
      name: 'New Folder'
    });
    if (!parentPath || settings.expandedRequestPaths.includes(parentPath)) return;
    const nextSettings = {
      ...settings,
      expandedRequestPaths: [...settings.expandedRequestPaths, parentPath]
    };
    dispatch(setRequesterSettings(nextSettings));
    requesterTnetApi.requester.workspaces
      .saveSettings({
        workspaceId: activeWorkspaceId,
        settings: nextSettings
      })
      .catch((error: unknown) => {
        console.error('Failed to expand requester folder', error);
      });
  };

  const cancelNewFolder = (): void => {
    setNewFolder(emptyNewFolder);
  };

  const confirmNewFolder = async (): Promise<void> => {
    if (!activeWorkspaceId || !newFolder.isActive) return;
    const folderName = newFolder.name.trim();
    if (!folderName || /[\\/]/.test(folderName)) {
      cancelNewFolder();
      return;
    }

    const folderPath = normalizeRequestFolderPath(
      newFolder.parentPath ? `${newFolder.parentPath}/${folderName}` : folderName
    );
    if (!folderPath) return;

    const expandedRequestPaths = settings.expandedRequestPaths.includes(folderPath)
      ? settings.expandedRequestPaths
      : [...settings.expandedRequestPaths, folderPath];
    const requestFolderPaths = settings.requestFolderPaths.includes(folderPath)
      ? settings.requestFolderPaths
      : [...settings.requestFolderPaths, folderPath];
    const nextSettings = {
      ...settings,
      expandedRequestPaths,
      requestFolderPaths
    };
    dispatch(setRequesterSettings(nextSettings));
    dispatch(setActiveRequesterFolder(folderPath));
    await requesterTnetApi.requester.workspaces.saveSettings({
      workspaceId: activeWorkspaceId,
      settings: nextSettings
    });
    cancelNewFolder();
  };

  const selectRequest = async (requestId: string): Promise<void> => {
    const request = await requesterTnetApi.requester.requests.get({ requestId });
    dispatch(setActiveRequesterRequest(request ?? undefined));
    dispatch(
      setActiveRequesterFolder(request ? requestFolderFromPath(request.requestPath) : undefined)
    );
  };

  const deleteSelectedRequest = async (): Promise<void> => {
    if (!activeWorkspaceId || !activeRequestId) return;
    const request = requests.find((request) => request.id === activeRequestId);
    if (!window.confirm(`Delete ${request?.requestPath ?? 'request'}?`)) return;
    await requesterTnetApi.requester.requests.remove({ requestId: activeRequestId });
    const latestRequests = await requesterTnetApi.requester.requests.list({
      workspaceId: activeWorkspaceId
    });
    dispatch(setRequesterRequests(latestRequests));
    dispatch(setActiveRequesterRequest(undefined));
  };

  const runSequence = async (): Promise<void> => {
    if (!activeWorkspaceId || requests.length === 0) return;

    let lastHistoryRequestId: string | undefined;
    for (const request of requests) {
      const detail = await requesterTnetApi.requester.requests.get({ requestId: request.id });
      if (!detail) continue;
      const result = await requesterTnetApi.requester.execution.send({
        ...detail,
        timeoutMs: settings.requestTimeoutMs,
        followRedirects: settings.followRedirects,
        cookieJarEnabled: settings.cookieJarEnabled,
        validateTlsCertificates: settings.validateTlsCertificates,
        proxyMode: settings.proxyMode,
        proxyHost: settings.proxyHost,
        proxyPort: settings.proxyPort,
        proxyUsername: settings.proxyUsername,
        proxyPasswordSecretId: settings.proxyPasswordSecretId,
        clientCertificatePath: settings.clientCertificatePath,
        clientCertificateKeyPath: settings.clientCertificateKeyPath,
        clientCertificatePassphraseSecretId: settings.clientCertificatePassphraseSecretId,
        customCaCertificatePath: settings.customCaCertificatePath,
        variableSetId: settings.defaultVariableSetId
      });
      dispatch(setRequesterResponse(result.response));
      dispatch(setRequesterResponseError(undefined));
      lastHistoryRequestId = detail.id;
    }

    const history = await requesterTnetApi.requester.history.list({
      workspaceId: activeWorkspaceId,
      requestId: lastHistoryRequestId
    });
    dispatch(setRequesterHistory(history));
  };

  const startRenameRequest = (requestId: string): void => {
    const request = requests.find((request) => request.id === requestId);
    if (!request) return;
    setRenameRequest({
      isActive: true,
      requestId,
      name: request.name,
      folderPath: requestFolderFromPath(request.requestPath) ?? ''
    });
  };

  const cancelRenameRequest = (): void => {
    setRenameRequest(emptyRenameRequest);
  };

  const confirmRenameRequest = async (): Promise<void> => {
    if (!activeWorkspaceId || !renameRequest.requestId) return;
    const name = renameRequest.name.trim();
    if (!name || /[\\/]/.test(name)) {
      cancelRenameRequest();
      return;
    }
    const folderPath = normalizeRequestFolderPath(renameRequest.folderPath) ?? '';
    const detail = await requesterTnetApi.requester.requests.get({
      requestId: renameRequest.requestId
    });
    if (!detail) {
      cancelRenameRequest();
      return;
    }
    const saved = await requesterTnetApi.requester.requests.save({
      ...detail,
      name,
      requestPath: normalizeRequestPath(folderPath ? `${folderPath}/${name}` : name)
    });
    const latestRequests = await requesterTnetApi.requester.requests.list({
      workspaceId: activeWorkspaceId
    });
    const nextSettings = folderPath
      ? {
          ...settings,
          expandedRequestPaths: settings.expandedRequestPaths.includes(folderPath)
            ? settings.expandedRequestPaths
            : [...settings.expandedRequestPaths, folderPath],
          requestFolderPaths: settings.requestFolderPaths.includes(folderPath)
            ? settings.requestFolderPaths
            : [...settings.requestFolderPaths, folderPath]
        }
      : settings;

    if (nextSettings !== settings) {
      dispatch(setRequesterSettings(nextSettings));
      await requesterTnetApi.requester.workspaces.saveSettings({
        workspaceId: activeWorkspaceId,
        settings: nextSettings
      });
    }
    dispatch(setRequesterRequests(latestRequests));
    dispatch(setActiveRequesterFolder(requestFolderFromPath(saved.requestPath)));
    if (activeRequestId === saved.id) dispatch(setActiveRequesterRequest(saved));
    cancelRenameRequest();
  };

  const selectFolder = (folderPath: string): void => {
    dispatch(setActiveRequesterRequest(undefined));
    dispatch(setActiveRequesterFolder(folderPath));
  };

  const toggleFolder = async (folderPath: string): Promise<void> => {
    if (!activeWorkspaceId) return;
    const expandedRequestPaths = settings.expandedRequestPaths.includes(folderPath)
      ? settings.expandedRequestPaths.filter((path) => path !== folderPath)
      : [...settings.expandedRequestPaths, folderPath];
    const nextSettings = {
      ...settings,
      expandedRequestPaths
    };
    dispatch(setRequesterSettings(nextSettings));
    await requesterTnetApi.requester.workspaces.saveSettings({
      workspaceId: activeWorkspaceId,
      settings: nextSettings
    });
  };

  const runAction = (action: () => Promise<void>): void => {
    action().catch((error: unknown) => {
      console.error('Requester sidebar action failed', error);
      dispatch(setRequesterResponseError(toExecutionErrorSnapshot(error)));
      dispatch(setRequesterError('Requester action failed.'));
    });
  };

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    enabled: Boolean(activeWorkspaceId),
    onTrigger: () => runAction(createRequest)
  });

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    shift: true,
    enabled: Boolean(activeWorkspaceId),
    onTrigger: startNewFolder
  });

  useShortcut({
    key: 'Delete',
    enabled: Boolean(activeRequestId),
    onTrigger: () => runAction(deleteSelectedRequest)
  });

  return (
    <aside className={sharedStyles.panel} aria-label="Requester workspace">
      <RequesterWorkspaceSwitcher
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onActivateWorkspace={(workspaceId) => runAction(() => activateWorkspace(workspaceId))}
        onCreateWorkspace={() => runAction(createWorkspace)}
      />
      <div className={sharedStyles.content}>
        <header className={sharedStyles.header}>
          <span className={sharedStyles.title}>Requests</span>
          <button
            type="button"
            className={`${sharedStyles.iconButton} material-icons-round`}
            aria-label="Run sequence"
            title="Run sequence"
            disabled={!activeWorkspaceId || requests.length === 0}
            onClick={() => runAction(runSequence)}
          >
            play_arrow
          </button>
          <button
            type="button"
            className={`${sharedStyles.iconButton} material-icons-round`}
            aria-label="Create request"
            title="Create request"
            disabled={!activeWorkspaceId}
            onClick={() => runAction(createRequest)}
          >
            add
          </button>
        </header>
        <ul className={sharedStyles.fileList}>
          {shouldShowNewFolderAtRoot ? (
            <li className={sharedStyles.newItem}>
              <div className={sharedStyles.treeItem}>
                <span
                  className={`material-icons-round ${sharedStyles.chevron} ${sharedStyles.iconPlaceholder}`}
                >
                  chevron_right
                </span>
                <span className={`material-icons ${sharedStyles.folder}`}>folder</span>
                <input
                  className={sharedStyles.newInput}
                  value={newFolder.name}
                  onChange={(event) =>
                    setNewFolder((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      confirmNewFolder().catch((error: unknown) => {
                        console.error('Failed to create requester folder', error);
                      });
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelNewFolder();
                    }
                  }}
                  onBlur={cancelNewFolder}
                  autoFocus
                />
              </div>
            </li>
          ) : null}
          <RequesterRequestTree
            activeFolderPath={activeFolderPath}
            activeRequestId={activeRequestId}
            expandedPaths={settings.expandedRequestPaths}
            newFolder={newFolder}
            nodes={requestTree}
            onCancelNewFolder={cancelNewFolder}
            onConfirmNewFolder={confirmNewFolder}
            onNewFolderNameChange={(name) =>
              setNewFolder((current) => ({
                ...current,
                name
              }))
            }
            onSelectFolder={selectFolder}
            onSelectRequest={(requestId) => runAction(() => selectRequest(requestId))}
            onStartRenameRequest={startRenameRequest}
            onToggleFolder={(folderPath) => runAction(() => toggleFolder(folderPath))}
          />
        </ul>
        {!activeWorkspaceId ? (
          <p className={sharedStyles.emptyMessage}>Create a workspace to begin.</p>
        ) : requests.length === 0 ? (
          <p className={sharedStyles.emptyMessage}>No requests yet.</p>
        ) : null}
      </div>
      {renameRequest.isActive ? (
        <RequesterRenameDialog
          name={renameRequest.name}
          folderPath={renameRequest.folderPath}
          pathPreview={renameRequestPathPreview}
          onNameChange={(name) =>
            setRenameRequest((current) => ({
              ...current,
              name
            }))
          }
          onFolderPathChange={(folderPath) =>
            setRenameRequest((current) => ({
              ...current,
              folderPath
            }))
          }
          onCancel={cancelRenameRequest}
          onSave={() => runAction(confirmRenameRequest)}
        />
      ) : null}
    </aside>
  );
};
