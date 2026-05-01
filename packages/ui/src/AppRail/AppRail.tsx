import type { AppId } from '@tnet/shared/app/appTypes';
import styles from './AppRail.module.css';

export interface AppRailItem {
  id: AppId;
  label: string;
  icon: string;
}

interface AppRailProps {
  apps: AppRailItem[];
  activeAppId: AppId;
  onSelect: (appId: AppId) => void;
}

export const AppRail = ({ apps, activeAppId, onSelect }: AppRailProps): React.JSX.Element => (
  <nav className={styles.rail} aria-label="Applications">
    {apps.map((app) => (
      <button
        key={app.id}
        type="button"
        className={`${styles.item} material-icons-round ${
          app.id === activeAppId ? styles.active : ''
        }`}
        aria-label={app.label}
        aria-current={app.id === activeAppId ? 'page' : undefined}
        title={app.label}
        onClick={() => onSelect(app.id)}
      >
        {app.icon}
      </button>
    ))}
  </nav>
);
