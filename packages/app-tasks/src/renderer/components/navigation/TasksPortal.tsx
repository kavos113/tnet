import type { AppId } from '@tnet/shared/app/appTypes';
import styles from './TasksPortal.module.css';

export interface TasksPortalShortcut {
  id: AppId;
  label: string;
  icon: string;
}

export interface TasksPortalProps {
  shortcuts: TasksPortalShortcut[];
  onSelect: (appId: AppId) => void;
}

export const TasksPortal = ({
  shortcuts,
  onSelect
}: TasksPortalProps): React.JSX.Element | null => {
  if (shortcuts.length === 0) return null;

  return (
    <section className={styles.portal} aria-label="App shortcuts">
      <h2 className={styles.title}>Shortcuts</h2>
      <div className={styles.shortcuts}>
        {shortcuts.map((shortcut) => (
          <button
            type="button"
            className={styles.shortcut}
            key={shortcut.id}
            onClick={() => onSelect(shortcut.id)}
          >
            <span className={`material-symbols-rounded ${styles.icon}`} aria-hidden="true">
              {shortcut.icon}
            </span>
            <span>{shortcut.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
