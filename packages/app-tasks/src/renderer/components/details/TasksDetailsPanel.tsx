import { useEffect, useRef } from 'react';
import type {
  CalendarEventOccurrence,
  LocalEvent,
  TaskItem,
  SubscribedTaskOccurrence
} from '@tnet/app-tasks/shared/tasksTypes';
import { accentColorStyle } from '../../utils/taskColors';
import styles from './TasksDetailsPanel.module.css';

export type TasksDetailsPanelReadOnlyItem =
  | { type: 'task'; task: TaskItem; accentColor?: string; sourceName?: string; onEdit?: () => void }
  | { type: 'event'; event: LocalEvent; onEdit?: () => void }
  | {
      type: 'subscription-event';
      event: CalendarEventOccurrence;
      accentColor?: string;
      sourceName?: string;
    }
  | {
      type: 'subscription-task';
      task: SubscribedTaskOccurrence;
      accentColor?: string;
      sourceName?: string;
    };

export interface TasksDetailsPanelProps {
  children?: React.ReactNode;
  readOnlyItem?: TasksDetailsPanelReadOnlyItem;
  title: string;
  onClose: () => void;
}

export const TasksDetailsPanel = ({
  children,
  readOnlyItem,
  title,
  onClose
}: TasksDetailsPanelProps): React.JSX.Element => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={`${styles.closeButton} material-symbols-rounded`}
            aria-label="Close details"
            onClick={onClose}
          >
            close
          </button>
        </header>
        <div className={styles.body}>
          {readOnlyItem ? <CategoryHeadline item={readOnlyItem} /> : null}
          {readOnlyItem ? <ReadOnlyDetails item={readOnlyItem} /> : children}
        </div>
      </aside>
    </div>
  );
};

const CategoryHeadline = ({
  item
}: {
  item: TasksDetailsPanelReadOnlyItem;
}): React.JSX.Element | null => {
  if (item.type === 'task' && item.task.category) {
    return <h3 className={styles.categoryHeadline}>Category: {item.task.category}</h3>;
  } else if (item.type === 'task' && item.sourceName) {
    return <h3 className={styles.categoryHeadline}>Subscription: {item.sourceName}</h3>;
  } else if (item.type === 'subscription-task' && item.sourceName) {
    return <h3 className={styles.categoryHeadline}>Subscription: {item.sourceName}</h3>;
  } else if (item.type === 'subscription-event' && item.sourceName) {
    return <h3 className={styles.categoryHeadline}>Subscription: {item.sourceName}</h3>;
  }
  return null;
};

const ReadOnlyDetails = ({ item }: { item: TasksDetailsPanelReadOnlyItem }): React.JSX.Element => {
  if (item.type === 'task') {
    const task = item.task;
    return (
      <div className={styles.readOnly} style={accentColorStyle(item.accentColor)}>
        <h3>{task.title}</h3>
        <p className={styles.meta}>
          {formatTaskDeadline(task)}
          {task.completedAt ? ' completed' : ''}
        </p>
        {task.notes ? <p className={styles.description}>{task.notes}</p> : null}
        {item.onEdit ? (
          <button type="button" className={styles.primaryButton} onClick={item.onEdit}>
            Edit
          </button>
        ) : null}
      </div>
    );
  }

  if (item.type === 'event') {
    const event = item.event;
    return (
      <div className={styles.readOnly}>
        <h3>{event.title}</h3>
        <p className={styles.meta}>
          {event.allDay ? 'All day' : `${event.startsAt} - ${event.endsAt}`}
        </p>
        {event.location ? <p className={styles.meta}>{event.location}</p> : null}
        {event.description ? <p className={styles.description}>{event.description}</p> : null}
        {item.onEdit ? (
          <button type="button" className={styles.primaryButton} onClick={item.onEdit}>
            Edit
          </button>
        ) : null}
      </div>
    );
  }

  if (item.type === 'subscription-task') {
    const task = item.task;
    return (
      <div className={styles.readOnly} style={accentColorStyle(item.accentColor)}>
        <h3>{task.title}</h3>
        <p className={styles.meta}>
          {task.deadlineDate}
          {task.deadlineTime ? ` ${task.deadlineTime}` : ''} subscribed
          {task.completedAt ? ' completed' : ''}
        </p>
        {task.description ? <p className={styles.description}>{task.description}</p> : null}
      </div>
    );
  }

  const event = item.event;
  return (
    <div className={styles.readOnly} style={accentColorStyle(item.accentColor)}>
      <h3>{event.title}</h3>
      <p className={styles.meta}>
        {event.allDay ? 'All day' : `${event.startsAt} - ${event.endsAt}`} subscribed
      </p>
      {event.location ? <p className={styles.meta}>{event.location}</p> : null}
      {event.description ? <p className={styles.description}>{event.description}</p> : null}
    </div>
  );
};

const formatTaskDeadline = (task: TaskItem): string => {
  if (!task.deadlineDate) return 'No deadline';
  return task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : task.deadlineDate;
};
