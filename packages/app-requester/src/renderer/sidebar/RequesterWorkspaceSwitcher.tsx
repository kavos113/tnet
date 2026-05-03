import type { RequesterWorkspace } from '@tnet/app-requester/shared/requesterTypes';
import styles from '../RequesterWorkspaceSwitcher.module.css';

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
  <nav className={styles.workspaceSwitcher} aria-label="Requester workspaces">
    {workspaces.map((workspace) => (
      <button
        key={workspace.id}
        type="button"
        className={`${styles.workspaceSwitcherItem} ${
          workspace.id === activeWorkspaceId ? styles.workspaceSwitcherItemActive : ''
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
      className={`${styles.workspaceSwitcherAdd} material-icons-round`}
      aria-label="Create requester workspace"
      title="Create requester workspace"
      onClick={onCreateWorkspace}
    >
      add
    </button>
  </nav>
);

const workspaceInitial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase();
