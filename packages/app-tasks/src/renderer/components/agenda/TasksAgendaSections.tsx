import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { DeadlineBody, ReadOnlyTaskRow, SectionHeader, TaskRow } from './TasksAgendaRows';
import styles from './TasksAgenda.module.css';

export const TaskSection = ({
  title,
  tasks,
  readOnlyTasks = [],
  onComplete,
  onDelete,
  onEdit,
  onReadOnlyTaskOpen,
  onTaskOpen
}: {
  title: string;
  tasks: TaskItem[];
  readOnlyTasks?: SubscribedTaskOccurrence[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
  onTaskOpen: (task: TaskItem) => void;
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
            onOpen={onTaskOpen}
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

export const EventSection = ({
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

export const DeadlineSection = ({
  title,
  items,
  onReadOnlyTaskOpen,
  onTaskOpen
}: {
  title: string;
  items: Array<TaskItem | SubscribedTaskOccurrence>;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
  onTaskOpen: (task: TaskItem) => void;
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
              <button type="button" className={styles.rowButton} onClick={() => onTaskOpen(item)}>
                <DeadlineBody item={item} />
              </button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No upcoming deadlines.</p>
    )}
  </section>
);
