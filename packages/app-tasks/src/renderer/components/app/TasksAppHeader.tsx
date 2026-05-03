import type { AppId } from '@tnet/shared/app/appTypes';
import type { TasksDefaultView, TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import type { TasksPortalShortcut } from '../navigation/TasksPortal';
import styles from './TasksApp.module.css';

export interface TasksAppHeaderProps {
  clock: Date;
  currentDate: string;
  portalShortcuts: TasksPortalShortcut[];
  settings: TasksGlobalSettings;
  view: TasksDefaultView;
  onSelectPortalApp: (appId: AppId) => void;
  onViewChange: (view: TasksDefaultView) => void;
}

export const TasksAppHeader = ({
  clock,
  currentDate,
  portalShortcuts,
  settings,
  view,
  onSelectPortalApp,
  onViewChange
}: TasksAppHeaderProps): React.JSX.Element => (
  <header className={styles.clockHeader} aria-label="Tasks header">
    <div className={styles.clockGroup}>
      <time
        className={`${styles.clock} ${settings.clockSize === 'compact' ? styles.clockCompact : ''}`}
        dateTime={clock.toISOString()}
      >
        {formatClock(clock, settings.timeFormat)}
      </time>
      <span className={styles.dateLabel}>{formatDateLabel(currentDate)}</span>
    </div>
    <div className={styles.headerActions}>
      {settings.showPortal ? (
        <PortalShortcuts shortcuts={portalShortcuts} onSelect={onSelectPortalApp} />
      ) : null}
      <ViewControls view={view} onViewChange={onViewChange} />
    </div>
  </header>
);

const PortalShortcuts = ({
  shortcuts,
  onSelect
}: {
  shortcuts: TasksPortalShortcut[];
  onSelect: (appId: AppId) => void;
}): React.JSX.Element | null => {
  if (shortcuts.length === 0) return null;

  return (
    <div className={styles.portalShortcuts} aria-label="App shortcuts">
      {shortcuts.map((shortcut) => (
        <button
          type="button"
          className={styles.portalShortcut}
          key={shortcut.id}
          title={shortcut.label}
          aria-label={shortcut.label}
          onClick={() => onSelect(shortcut.id)}
        >
          <span className={`material-icons-round ${styles.portalIcon}`} aria-hidden="true">
            {shortcut.icon}
          </span>
        </button>
      ))}
    </div>
  );
};

const ViewControls = ({
  view,
  onViewChange
}: {
  view: TasksDefaultView;
  onViewChange: (view: TasksDefaultView) => void;
}): React.JSX.Element => (
  <div className={styles.viewControls} aria-label="Task view">
    {(['today', 'week', 'month'] as TasksDefaultView[]).map((viewId) => (
      <button
        type="button"
        key={viewId}
        className={`${styles.viewButton} ${view === viewId ? styles.viewButtonActive : ''}`}
        onClick={() => onViewChange(viewId)}
      >
        {viewLabels[viewId]}
      </button>
    ))}
  </div>
);

const viewLabels: Record<TasksDefaultView, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month'
};

const formatClock = (date: Date, timeFormat: '12h' | '24h'): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  }).format(date);

const formatDateLabel = (date: string): string =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
