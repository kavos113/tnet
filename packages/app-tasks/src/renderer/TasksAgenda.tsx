import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import styles from './TasksAgenda.module.css';

export interface TasksAgendaProps {
  completedTasks: TaskItem[];
  todayEvents: Array<LocalEvent | CalendarEventOccurrence>;
  todaySubscribedTasks: SubscribedTaskOccurrence[];
  todayTasks: TaskItem[];
  undatedTasks: TaskItem[];
  upcomingDeadlines: Array<TaskItem | SubscribedTaskOccurrence>;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onEventOpen: (event: LocalEvent | CalendarEventOccurrence) => void;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
}

export const TasksAgenda = ({
  completedTasks,
  todayEvents,
  todaySubscribedTasks,
  todayTasks,
  undatedTasks,
  upcomingDeadlines,
  onComplete,
  onDelete,
  onEdit,
  onEventOpen,
  onReadOnlyTaskOpen
}: TasksAgendaProps): React.JSX.Element => (
  <div className={styles.column}>
    <TaskSection
      title="Today Tasks"
      tasks={todayTasks}
      readOnlyTasks={todaySubscribedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
    />
    <EventSection title="Today Events" events={todayEvents} onEventOpen={onEventOpen} />
    <DeadlineSection
      title="Upcoming Deadlines"
      items={upcomingDeadlines}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
    />
    <TaskSection
      title="No Deadline"
      tasks={undatedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
    />
    <TaskSection
      title="Completed Tasks"
      tasks={completedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
    />
  </div>
);

const TaskSection = ({
  title,
  tasks,
  readOnlyTasks = [],
  onComplete,
  onDelete,
  onEdit,
  onReadOnlyTaskOpen
}: {
  title: string;
  tasks: TaskItem[];
  readOnlyTasks?: SubscribedTaskOccurrence[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <SectionHeader count={tasks.length + readOnlyTasks.length} title={title} />
    {tasks.length > 0 || readOnlyTasks.length > 0 ? (
      <ul className={styles.list}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
        {readOnlyTasks.map((task) => (
          <ReadOnlyTaskRow key={task.id} task={task} onOpen={onReadOnlyTaskOpen} />
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No tasks.</p>
    )}
  </section>
);

const ReadOnlyTaskRow = ({
  task,
  onOpen
}: {
  task: SubscribedTaskOccurrence;
  onOpen: (task: SubscribedTaskOccurrence) => void;
}): React.JSX.Element => (
  <li className={`${styles.item} ${styles.readOnlyItem}`}>
    <button type="button" className={styles.rowButton} onClick={() => onOpen(task)}>
      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        <span className={styles.meta}>{formatSubscribedTaskDeadline(task)} read-only</span>
      </div>
    </button>
  </li>
);

const EventSection = ({
  title,
  events,
  onEventOpen
}: {
  title: string;
  events: Array<LocalEvent | CalendarEventOccurrence>;
  onEventOpen: (event: LocalEvent | CalendarEventOccurrence) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <SectionHeader count={events.length} title={title} />
    {events.length > 0 ? (
      <ul className={styles.list}>
        {events.map((event) => (
          <li key={event.id} className={`${styles.item} ${styles.readOnlyItem}`}>
            <button type="button" className={styles.rowButton} onClick={() => onEventOpen(event)}>
              <div className={styles.body}>
                <span className={styles.title}>{event.title}</span>
                <span className={styles.meta}>
                  {event.allDay
                    ? 'All day'
                    : `${event.startsAt.slice(11, 16)}-${event.endsAt.slice(11, 16)}`}
                  {'sourceId' in event ? ' subscribed' : ' local'}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No events.</p>
    )}
  </section>
);

const DeadlineSection = ({
  title,
  items,
  onReadOnlyTaskOpen
}: {
  title: string;
  items: Array<TaskItem | SubscribedTaskOccurrence>;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <SectionHeader count={items.length} title={title} />
    {items.length > 0 ? (
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={`${styles.item} ${styles.readOnlyItem}`}>
            {'sourceId' in item ? (
              <button
                type="button"
                className={styles.rowButton}
                onClick={() => onReadOnlyTaskOpen(item)}
              >
                <DeadlineBody item={item} />
              </button>
            ) : (
              <DeadlineBody item={item} />
            )}
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No upcoming deadlines.</p>
    )}
  </section>
);

const DeadlineBody = ({
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

const SectionHeader = ({ count, title }: { count: number; title: string }): React.JSX.Element => (
  <header className={styles.sectionHeader}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <span className={styles.count}>{count}</span>
  </header>
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
    className={styles.item}
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

const formatSubscribedTaskDeadline = (task: SubscribedTaskOccurrence): string =>
  task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : task.deadlineDate;

const formatDeadlineItem = (item: TaskItem | SubscribedTaskOccurrence): string =>
  'deadlineTime' in item && item.deadlineTime
    ? `${item.deadlineDate} ${item.deadlineTime}`
    : (item.deadlineDate ?? '');
