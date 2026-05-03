import type { CalendarDayItems, CalendarTaskItem } from '@tnet/app-tasks/shared/calendarView';
import type { TasksDefaultView } from '@tnet/app-tasks/shared/config';
import type { CalendarEventOccurrence, LocalEvent } from '@tnet/app-tasks/shared/tasksTypes';
import { TasksCalendarCell } from './TasksCalendarCell';
import styles from './TasksCalendar.module.css';

export interface TasksCalendarProps {
  categoryColors: Record<string, string>;
  currentDate: string;
  endDate: string;
  focusDate: string;
  items: CalendarDayItems[];
  sourceColors: Record<string, string>;
  showCurrentTime: boolean;
  startDate: string;
  view: TasksDefaultView;
  onDateSelect: (date: string) => void;
  onLocalEventSelect: (event: LocalEvent) => void;
  onSubscribedEventSelect: (event: CalendarEventOccurrence) => void;
  onTaskSelect: (task: CalendarTaskItem) => void;
  onMoveRange: (days: number) => void;
  onRescheduleTask: (taskId: string, date: string) => void;
  onToday: () => void;
}

export const TasksCalendar = ({
  categoryColors,
  currentDate,
  endDate,
  focusDate,
  items,
  sourceColors,
  showCurrentTime,
  startDate,
  view,
  onDateSelect,
  onLocalEventSelect,
  onSubscribedEventSelect,
  onTaskSelect,
  onMoveRange,
  onRescheduleTask,
  onToday
}: TasksCalendarProps): React.JSX.Element => {
  const moveSize = items.length > 8 ? 31 : 7;

  return (
    <section className={styles.pane} aria-label="Calendar">
      <header className={styles.header}>
        <h2 className={styles.title}>{formatCalendarTitle(startDate, endDate, focusDate, view)}</h2>
        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.iconButton} material-symbols-rounded`}
            aria-label="Previous range"
            onClick={() => onMoveRange(-moveSize)}
          >
            chevron_left
          </button>
          <button type="button" className={styles.navButton} onClick={onToday}>
            Today
          </button>
          <button
            type="button"
            className={`${styles.iconButton} material-symbols-rounded`}
            aria-label="Next range"
            onClick={() => onMoveRange(moveSize)}
          >
            chevron_right
          </button>
        </div>
      </header>
      <div className={styles.grid} role="grid" aria-label="Calendar days">
        {items.map((day) => (
          <TasksCalendarCell
            key={day.date}
            currentDate={currentDate}
            categoryColors={categoryColors}
            day={day}
            sourceColors={sourceColors}
            showCurrentTime={showCurrentTime}
            onDateSelect={onDateSelect}
            onEventSelect={onSubscribedEventSelect}
            onLocalEventSelect={onLocalEventSelect}
            onRescheduleTask={onRescheduleTask}
            onTaskSelect={onTaskSelect}
          />
        ))}
      </div>
    </section>
  );
};

const formatCalendarTitle = (
  startDate: string,
  endDate: string,
  focusDate: string,
  view: TasksDefaultView
): string => {
  if (view === 'month') {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric'
    }).format(new Date(`${focusDate}T00:00:00`));
  }
  return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
};
