import { basename } from '@tnet/shared/path/pathUtils';
import styles from './WorkspaceSwitcher.module.css';

const workspaceLabel = (rootPath: string): string => basename(rootPath) || rootPath;

const workspaceInitial = (rootPath: string): string => {
  const label = workspaceLabel(rootPath).trim();
  return (label[0] ?? '?').toUpperCase();
};

export interface WorkspaceSwitcherProps {
  roots: string[];
  activeRoot: string;
  ariaLabel: string;
  openLabel: string;
  onSwitchRoot: (rootPath: string) => void;
  onOpenRoot: () => void;
}

export const WorkspaceSwitcher = ({
  roots,
  activeRoot,
  ariaLabel,
  openLabel,
  onSwitchRoot,
  onOpenRoot
}: WorkspaceSwitcherProps): React.JSX.Element => {
  return (
    <nav className={styles.workspaceSwitcher} aria-label={ariaLabel}>
      {roots.map((root) => (
        <button
          key={root}
          type="button"
          className={`${styles.workspaceSwitcherItem} ${
            root === activeRoot ? styles.workspaceSwitcherItemActive : ''
          }`}
          title={root}
          aria-label={`Switch to ${workspaceLabel(root)}`}
          aria-current={root === activeRoot ? 'page' : undefined}
          onClick={() => {
            if (root === activeRoot) return;
            onSwitchRoot(root);
          }}
        >
          {workspaceInitial(root)}
        </button>
      ))}
      <button
        type="button"
        className={`${styles.workspaceSwitcherAdd} material-icons-round`}
        aria-label={openLabel}
        title={openLabel}
        onClick={onOpenRoot}
      >
        add
      </button>
    </nav>
  );
};
