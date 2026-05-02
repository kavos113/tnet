import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import styles from './TaskLists.module.css';

export interface TaskListsProps {
  todayTasks: TaskItem[];
  undatedTasks: TaskItem[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
}

export const TaskLists = ({
  todayTasks,
  undatedTasks,
  onComplete,
  onDelete,
  onEdit
}: TaskListsProps): React.JSX.Element => (
  <div className={styles.column}>
    <TaskSection
      title="Today"
      tasks={todayTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
    />
    <TaskSection
      title="No Deadline"
      tasks={undatedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
    />
  </div>
);

const TaskSection = ({
  title,
  tasks,
  onComplete,
  onDelete,
  onEdit
}: {
  title: string;
  tasks: TaskItem[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <header className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <span className={styles.count}>{tasks.length}</span>
    </header>
    {tasks.length > 0 ? (
      <ul className={styles.taskList}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No tasks.</p>
    )}
  </section>
);

const TaskRow = ({
  task,
  onComplete,
  onDelete,
  onEdit
}: {
  task: TaskItem;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
}): React.JSX.Element => (
  <li
    className={styles.taskItem}
    draggable
    onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
  >
    <input
      aria-label={`Complete ${task.title}`}
      className={styles.taskCheckbox}
      type="checkbox"
      checked={Boolean(task.completedAt)}
      onChange={(event) => onComplete(task.id, event.target.checked)}
    />
    <div className={styles.taskBody}>
      <span className={`${styles.taskTitle} ${task.completedAt ? styles.taskTitleDone : ''}`}>
        {task.title}
      </span>
      <span className={styles.taskMeta}>
        {task.deadlineDate ? <span>{formatTaskDeadline(task)}</span> : null}
        {task.category ? <span className={styles.categoryPill}>{task.category}</span> : null}
        {task.recurrenceRule ? <span>recurring</span> : null}
        {task.linkedEntityId ? <span>{task.linkedEntityId}</span> : null}
      </span>
    </div>
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
