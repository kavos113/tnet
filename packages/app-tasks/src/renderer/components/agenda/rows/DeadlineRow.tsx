import type { SubscribedTaskOccurrence, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { accentColorStyle } from '../../../utils/taskColors';
import styles from '../TasksAgendaRows.module.css';

export const DeadlineRow = ({
  item,
  accentColor,
  onComplete,
  onCompleteReadOnlyTask,
  onReadOnlyTaskOpen,
  onTaskOpen
}: {
  item: TaskItem | SubscribedTaskOccurrence;
  accentColor?: string;
  onComplete: (taskId: string, completed: boolean) => void;
  onCompleteReadOnlyTask: (occurrenceId: string, completed: boolean) => void;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
  onTaskOpen: (task: TaskItem) => void;
}): React.JSX.Element => {
  const isSubscribed = 'sourceId' in item;
  return (
    <li
      className={`${styles.item} ${styles.readOnlyTaskItem}`}
      style={accentColorStyle(accentColor)}
    >
      <input
        aria-label={`Complete deadline ${item.title}`}
        className={styles.checkbox}
        type="checkbox"
        checked={Boolean(item.completedAt)}
        onChange={(event) =>
          isSubscribed
            ? onCompleteReadOnlyTask(item.id, event.target.checked)
            : onComplete(item.id, event.target.checked)
        }
      />
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => (isSubscribed ? onReadOnlyTaskOpen(item) : onTaskOpen(item))}
      >
        <DeadlineBody item={item} />
      </button>
    </li>
  );
};

export const DeadlineBody = ({
  item
}: {
  item: TaskItem | SubscribedTaskOccurrence;
}): React.JSX.Element => (
  <div className={styles.body}>
    <span className={styles.title}>{item.title}</span>
    <span className={styles.meta}>
      {formatDeadlineItem(item)}
      {'sourceId' in item ? ' subscribed' : ''}
    </span>
  </div>
);

const formatDeadlineItem = (item: TaskItem | SubscribedTaskOccurrence): string =>
  'deadlineTime' in item && item.deadlineTime
    ? `${item.deadlineDate} ${item.deadlineTime}`
    : (item.deadlineDate ?? '');
