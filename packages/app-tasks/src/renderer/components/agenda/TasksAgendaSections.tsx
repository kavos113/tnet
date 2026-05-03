import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { DeadlineRow, SectionHeader, SubscribedTaskRow, TaskRow } from './TasksAgendaRows';
import {
  accentColorStyle,
  getSubscribedEventAccentColor,
  getSubscribedTaskAccentColor,
  getTaskAccentColor
} from '../../utils/taskColors';
import rowStyles from './TasksAgendaRows.module.css';
import styles from './TasksAgendaSections.module.css';

export const TaskSection = ({
  title,
  tasks,
  readOnlyTasks = [],
  categoryColors,
  sourceColors,
  onComplete,
  onCompleteReadOnlyTask,
  onDelete,
  onEdit,
  onReadOnlyTaskOpen,
  onTaskOpen
}: {
  title: string;
  tasks: TaskItem[];
  readOnlyTasks?: SubscribedTaskOccurrence[];
  categoryColors: Record<string, string>;
  sourceColors: Record<string, string>;
  onComplete: (taskId: string, completed: boolean) => void;
  onCompleteReadOnlyTask: (occurrenceId: string, completed: boolean) => void;
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
            accentColor={getTaskAccentColor(task, categoryColors)}
            onComplete={onComplete}
            onDelete={onDelete}
            onEdit={onEdit}
            onOpen={onTaskOpen}
          />
        ))}
        {readOnlyTasks.map((task) => (
          <SubscribedTaskRow
            key={task.id}
            task={task}
            accentColor={getSubscribedTaskAccentColor(task, sourceColors)}
            onComplete={onCompleteReadOnlyTask}
            onOpen={onReadOnlyTaskOpen}
          />
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
  sourceColors,
  onEventOpen
}: {
  title: string;
  events: Array<LocalEvent | CalendarEventOccurrence>;
  sourceColors: Record<string, string>;
  onEventOpen: (event: LocalEvent | CalendarEventOccurrence) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <SectionHeader count={events.length} title={title} />
    {events.length > 0 ? (
      <ul className={styles.list}>
        {events.map((event) => (
          <li
            key={event.id}
            className={`${rowStyles.item} ${rowStyles.readOnlyItem}`}
            style={accentColorStyle(
              'sourceId' in event ? getSubscribedEventAccentColor(event, sourceColors) : undefined
            )}
          >
            <button
              type="button"
              className={rowStyles.rowButton}
              onClick={() => onEventOpen(event)}
            >
              <div className={rowStyles.body}>
                <span className={rowStyles.title}>{event.title}</span>
                <span className={rowStyles.meta}>
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
  categoryColors,
  sourceColors,
  onComplete,
  onCompleteReadOnlyTask,
  onReadOnlyTaskOpen,
  onTaskOpen
}: {
  title: string;
  items: Array<TaskItem | SubscribedTaskOccurrence>;
  categoryColors: Record<string, string>;
  sourceColors: Record<string, string>;
  onComplete: (taskId: string, completed: boolean) => void;
  onCompleteReadOnlyTask: (occurrenceId: string, completed: boolean) => void;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
  onTaskOpen: (task: TaskItem) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <SectionHeader count={items.length} title={title} />
    {items.length > 0 ? (
      <ul className={styles.list}>
        {items.map((item) => (
          <DeadlineRow
            key={item.id}
            item={item}
            accentColor={
              'sourceId' in item
                ? getSubscribedTaskAccentColor(item, sourceColors)
                : getTaskAccentColor(item, categoryColors)
            }
            onComplete={onComplete}
            onCompleteReadOnlyTask={onCompleteReadOnlyTask}
            onReadOnlyTaskOpen={onReadOnlyTaskOpen}
            onTaskOpen={onTaskOpen}
          />
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No upcoming deadlines.</p>
    )}
  </section>
);
