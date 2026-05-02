import styles from './CalendarDateActions.module.css';

export interface CalendarDateActionsProps {
  date: string;
  onAddEvent: () => void;
  onAddTask: () => void;
}

export const CalendarDateActions = ({
  date,
  onAddEvent,
  onAddTask
}: CalendarDateActionsProps): React.JSX.Element => (
  <div className={styles.bar} role="toolbar" aria-label="Calendar date actions">
    <span>{date}</span>
    <button type="button" className={styles.secondaryButton} onClick={onAddTask}>
      Add Task
    </button>
    <button type="button" className={styles.secondaryButton} onClick={onAddEvent}>
      Add Event
    </button>
  </div>
);
