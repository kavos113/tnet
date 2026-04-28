import type { AppId } from '@shared/app/appTypes';

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
  <nav className="app-rail" aria-label="Applications">
    {apps.map((app) => (
      <button
        key={app.id}
        type="button"
        className={`app-rail-item material-icons-round ${
          app.id === activeAppId ? 'app-rail-item-active' : ''
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
