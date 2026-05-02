import { useEffect, useRef } from 'react';
import type {
  CalendarEventOccurrence,
  SubscribedTaskOccurrence
} from '@tnet/app-tasks/shared/tasksTypes';
import styles from './TasksDetailsPanel.module.css';

export type TasksDetailsPanelReadOnlyItem =
  | { type: 'subscription-event'; event: CalendarEventOccurrence }
  | { type: 'subscription-task'; task: SubscribedTaskOccurrence };

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
            className={`${styles.closeButton} material-icons-round`}
            aria-label="Close details"
            onClick={onClose}
          >
            close
          </button>
        </header>
        <div className={styles.body}>
          {readOnlyItem ? <ReadOnlyDetails item={readOnlyItem} /> : children}
        </div>
      </aside>
    </div>
  );
};

const ReadOnlyDetails = ({ item }: { item: TasksDetailsPanelReadOnlyItem }): React.JSX.Element => {
  if (item.type === 'subscription-task') {
    const task = item.task;
    return (
      <div className={styles.readOnly}>
        <h3>{task.title}</h3>
        <p className={styles.meta}>
          {task.deadlineDate}
          {task.deadlineTime ? ` ${task.deadlineTime}` : ''} read-only
        </p>
        {task.description ? <p className={styles.description}>{task.description}</p> : null}
      </div>
    );
  }

  const event = item.event;
  return (
    <div className={styles.readOnly}>
      <h3>{event.title}</h3>
      <p className={styles.meta}>
        {event.allDay ? 'All day' : `${event.startsAt} - ${event.endsAt}`} read-only
      </p>
      {event.location ? <p className={styles.meta}>{event.location}</p> : null}
      {event.description ? <p className={styles.description}>{event.description}</p> : null}
    </div>
  );
};
