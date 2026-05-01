import type { RequesterWorkspace } from '@tnet/app-requester/shared/requesterTypes';

interface RequesterWorkspaceSwitcherProps {
  workspaces: RequesterWorkspace[];
  activeWorkspaceId?: string;
  onActivateWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
}

export const RequesterWorkspaceSwitcher = ({
  workspaces,
  activeWorkspaceId,
  onActivateWorkspace,
  onCreateWorkspace
}: RequesterWorkspaceSwitcherProps): React.JSX.Element => (
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
        onClick={() => onActivateWorkspace(workspace.id)}
      >
        {workspaceInitial(workspace.name)}
      </button>
    ))}
    <button
      type="button"
      className="workspace-switcher-add material-icons-round"
      aria-label="Create requester workspace"
      title="Create requester workspace"
      onClick={onCreateWorkspace}
    >
      add
    </button>
  </nav>
);

const workspaceInitial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();
