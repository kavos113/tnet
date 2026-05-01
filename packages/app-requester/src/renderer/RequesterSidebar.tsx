import {
  setActiveRequesterFolder,
  setActiveRequesterRequest,
  setRequesterError,
  setRequesterSettings,
  setRequesterWorkspace
} from './requesterSlice';
import {
  buildRequesterExplorerTree,
  normalizeRequestPath,
  requestFolderFromPath
} from '@tnet/app-requester/shared/requestPath';
import { requesterTnetApi } from './requesterTnetApi';
import { RequesterRequestTree } from './RequesterRequestTree';
import { useRequesterDispatch, useRequesterSelector } from './storeHooks';

const workspaceInitial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();

export const RequesterSidebar = (): React.JSX.Element => {
  const dispatch = useRequesterDispatch();
  const activeFolderPath = useRequesterSelector((state) => state.requester.activeRequestFolderPath);
  const activeWorkspaceId = useRequesterSelector((state) => state.requester.activeWorkspaceId);
  const activeRequestId = useRequesterSelector((state) => state.requester.activeRequestId);
  const requests = useRequesterSelector((state) => state.requester.requests);
  const settings = useRequesterSelector((state) => state.requester.settings);
  const workspaces = useRequesterSelector((state) => state.requester.workspaces);
  const requestTree = buildRequesterExplorerTree(requests);

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

  const selectRequest = async (requestId: string): Promise<void> => {
    const request = await requesterTnetApi.requester.requests.get({ requestId });
    dispatch(setActiveRequesterRequest(request ?? undefined));
    dispatch(
      setActiveRequesterFolder(request ? requestFolderFromPath(request.requestPath) : undefined)
    );
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
      dispatch(setRequesterError('Requester action failed.'));
    });
  };

  return (
    <aside className="explorer-panel" aria-label="Requester workspace">
      <nav className="workspace-switcher" aria-label="Requester workspaces">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            className={`workspace-switcher-item ${
              workspace.id === activeWorkspaceId ? 'workspace-switcher-item-active' : ''
            }`}
            title={workspace.name}
            aria-label={`Switch to ${workspace.name}`}
            aria-current={workspace.id === activeWorkspaceId ? 'page' : undefined}
            onClick={() => runAction(() => activateWorkspace(workspace.id))}
          >
            {workspaceInitial(workspace.name)}
          </button>
        ))}
        <button
          type="button"
          className="workspace-switcher-add material-icons-round"
          aria-label="Create requester workspace"
          title="Create requester workspace"
          onClick={() => runAction(createWorkspace)}
        >
          add
        </button>
      </nav>
      <div className="explorer-content">
        <header className="sidebar-header">
          <span className="sidebar-title">Requests</span>
          <button
            type="button"
            className="sidebar-icon-button material-icons-round"
            aria-label="Create request"
            title="Create request"
            disabled={!activeWorkspaceId}
            onClick={() => runAction(createRequest)}
          >
            add
          </button>
        </header>
        <ul className="file-explorer-list">
          <RequesterRequestTree
            activeFolderPath={activeFolderPath}
            activeRequestId={activeRequestId}
            expandedPaths={settings.expandedRequestPaths}
            nodes={requestTree}
            onSelectFolder={selectFolder}
            onSelectRequest={(requestId) => runAction(() => selectRequest(requestId))}
            onToggleFolder={(folderPath) => runAction(() => toggleFolder(folderPath))}
          />
        </ul>
        {!activeWorkspaceId ? (
          <p className="empty-list-message">Create a workspace to begin.</p>
        ) : requests.length === 0 ? (
          <p className="empty-list-message">No requests yet.</p>
        ) : null}
      </div>
    </aside>
  );
};
