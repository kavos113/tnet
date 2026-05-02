import type { TasksDefaultView, TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import styles from './TasksApp.module.css';

export interface TasksAppHeaderProps {
  clock: Date;
  currentDate: string;
  settings: TasksGlobalSettings;
  view: TasksDefaultView;
  onViewChange: (view: TasksDefaultView) => void;
}

export const TasksAppHeader = ({
  clock,
  currentDate,
  settings,
  view,
  onViewChange
}: TasksAppHeaderProps): React.JSX.Element => (
  <header className={styles.clockHeader}>
    <div className={styles.clockGroup}>
      <time
        className={`${styles.clock} ${settings.clockSize === 'compact' ? styles.clockCompact : ''}`}
        dateTime={clock.toISOString()}
      >
        {formatClock(clock, settings.timeFormat)}
      </time>
      <span className={styles.dateLabel}>{formatDateLabel(currentDate)}</span>
    </div>
    <ViewControls view={view} onViewChange={onViewChange} />
  </header>
);

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
