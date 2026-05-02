import type { CalendarDayItems } from '@tnet/app-tasks/shared/calendarView';
import type {
  CalendarEventOccurrence,
  LocalEvent,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { TasksCalendarCell } from './TasksCalendarCell';
import styles from './TasksCalendar.module.css';

export interface TasksCalendarProps {
  currentDate: string;
  endDate: string;
  items: CalendarDayItems[];
  showCurrentTime: boolean;
  startDate: string;
  onDateSelect: (date: string) => void;
  onLocalEventSelect: (event: LocalEvent) => void;
  onSubscribedEventSelect: (event: CalendarEventOccurrence) => void;
  onTaskSelect: (task: TaskItem) => void;
  onMoveRange: (days: number) => void;
  onRescheduleTask: (taskId: string, date: string) => void;
  onToday: () => void;
}

export const TasksCalendar = ({
  currentDate,
  endDate,
  items,
  showCurrentTime,
  startDate,
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
        <h2 className={styles.title}>{formatCalendarTitle(startDate, endDate)}</h2>
        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.iconButton} material-icons-round`}
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
            className={`${styles.iconButton} material-icons-round`}
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
            day={day}
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

const formatCalendarTitle = (startDate: string, endDate: string): string =>
  startDate === endDate ? startDate : `${startDate} - ${endDate}`;
