import type { SubscribedTaskOccurrence } from '@tnet/app-tasks/shared/tasksTypes';
import { accentColorStyle } from '../../../utils/taskColors';
import styles from '../TasksAgendaRows.module.css';

export const SubscribedTaskRow = ({
  task,
  accentColor,
  onComplete,
  onOpen
}: {
  task: SubscribedTaskOccurrence;
  accentColor?: string;
  onComplete: (occurrenceId: string, completed: boolean) => void;
  onOpen: (task: SubscribedTaskOccurrence) => void;
}): React.JSX.Element => (
  <li className={`${styles.item} ${styles.readOnlyTaskItem}`} style={accentColorStyle(accentColor)}>
    <input
      aria-label={`Complete ${task.title}`}
      className={styles.checkbox}
      type="checkbox"
      checked={Boolean(task.completedAt)}
      onChange={(event) => onComplete(task.id, event.target.checked)}
    />
    <button type="button" className={styles.rowButton} onClick={() => onOpen(task)}>
      <div className={styles.body}>
        <span className={`${styles.title} ${task.completedAt ? styles.titleDone : ''}`}>
          {task.title}
        </span>
        <span className={styles.meta}>{formatSubscribedTaskDeadline(task)} subscribed</span>
      </div>
    </button>
  </li>
);

const formatSubscribedTaskDeadline = (task: SubscribedTaskOccurrence): string =>
  task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : task.deadlineDate;
