import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { accentColorStyle } from '../../../utils/taskColors';
import styles from '../TasksAgendaRows.module.css';

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

const formatTaskDeadline = (task: TaskItem): string =>
  task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : (task.deadlineDate ?? '');
