import type { SubscribedTaskOccurrence, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { accentColorStyle } from '../../utils/taskColors';
import styles from './TasksAgenda.module.css';

export const SectionHeader = ({
  count,
  title
}: {
  count: number;
  title: string;
}): React.JSX.Element => (
  <header className={styles.sectionHeader}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <span className={styles.count}>{count}</span>
  </header>
);

export const TaskRow = ({
  task,
  accentColor,
  onComplete,
  onDelete,
  onEdit,
  onOpen
}: {
  task: TaskItem;
  accentColor?: string;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onOpen: (task: TaskItem) => void;
}): React.JSX.Element => (
  <li
    className={styles.item}
    style={accentColorStyle(accentColor)}
    draggable
    onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
  >
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
        <span className={styles.meta}>
          {task.deadlineDate ? <span>{formatTaskDeadline(task)}</span> : null}
          {task.category ? <span className={styles.categoryPill}>{task.category}</span> : null}
          {task.recurrenceRule ? <span>recurring</span> : null}
          {task.linkedEntityId ? <span>{task.linkedEntityId}</span> : null}
        </span>
      </div>
    </button>
    <button
      type="button"
      className={`${styles.iconButton} material-icons-round`}
      aria-label={`Edit ${task.title}`}
      onClick={() => onEdit(task)}
    >
      edit
    </button>
    <button
      type="button"
      className={`${styles.iconButton} material-icons-round`}
      aria-label={`Delete ${task.title}`}
      onClick={() => onDelete(task.id)}
    >
      delete
    </button>
  </li>
);

export const ReadOnlyTaskRow = ({
  task,
  accentColor,
  onOpen
}: {
  task: SubscribedTaskOccurrence;
  accentColor?: string;
  onOpen: (task: SubscribedTaskOccurrence) => void;
}): React.JSX.Element => (
  <li className={`${styles.item} ${styles.readOnlyItem}`} style={accentColorStyle(accentColor)}>
    <button type="button" className={styles.rowButton} onClick={() => onOpen(task)}>
      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        <span className={styles.meta}>{formatSubscribedTaskDeadline(task)} read-only</span>
      </div>
    </button>
  </li>
);

export const DeadlineBody = ({
  item
}: {
  item: TaskItem | SubscribedTaskOccurrence;
}): React.JSX.Element => (
  <div className={styles.body}>
    <span className={styles.title}>{item.title}</span>
    <span className={styles.meta}>
      {formatDeadlineItem(item)}
      {'sourceId' in item ? ' read-only' : ''}
    </span>
  </div>
);

const formatTaskDeadline = (task: TaskItem): string =>
  task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : (task.deadlineDate ?? '');

const formatSubscribedTaskDeadline = (task: SubscribedTaskOccurrence): string =>
  task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : task.deadlineDate;

const formatDeadlineItem = (item: TaskItem | SubscribedTaskOccurrence): string =>
  'deadlineTime' in item && item.deadlineTime
    ? `${item.deadlineDate} ${item.deadlineTime}`
    : (item.deadlineDate ?? '');
