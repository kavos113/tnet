import { toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';
import type { CalendarDayItems } from '@tnet/app-tasks/shared/calendarView';
import type { CalendarEventOccurrence, LocalEvent } from '@tnet/app-tasks/shared/tasksTypes';
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
          <CalendarCell
            key={day.date}
            currentDate={currentDate}
            day={day}
            showCurrentTime={showCurrentTime}
            onDateSelect={onDateSelect}
            onEventSelect={onSubscribedEventSelect}
            onLocalEventSelect={onLocalEventSelect}
            onRescheduleTask={onRescheduleTask}
          />
        ))}
      </div>
    </section>
  );
};

const CalendarCell = ({
  currentDate,
  day,
  showCurrentTime,
  onDateSelect,
  onEventSelect,
  onLocalEventSelect,
  onRescheduleTask
}: {
  currentDate: string;
  day: CalendarDayItems;
  showCurrentTime: boolean;
  onDateSelect: (date: string) => void;
  onEventSelect: (event: CalendarEventOccurrence) => void;
  onLocalEventSelect: (event: LocalEvent) => void;
  onRescheduleTask: (taskId: string, date: string) => void;
}): React.JSX.Element => {
  const today = toLocalDateString();
  const isToday = day.date === today;
  const currentTimeTop = getCurrentTimeTop();

  return (
    <div
      className={`${styles.cell} ${isToday ? styles.cellToday : ''} ${
        day.isOutsideCurrentMonth ? styles.cellOutsideMonth : ''
      } ${day.isSaturday ? styles.cellSaturday : ''} ${
        day.isSunday || day.isHoliday ? styles.cellHoliday : ''
      }`}
      role="gridcell"
      aria-label={`Calendar day ${day.date}`}
      tabIndex={0}
      onClick={() => onDateSelect(day.date)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onDateSelect(day.date);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData('text/plain');
        if (taskId) onRescheduleTask(taskId, day.date);
      }}
    >
      <div className={styles.dayLabel}>
        <span>{formatShortWeekday(day.date)}</span>
        <span>{Number(day.date.slice(8, 10))}</span>
      </div>
      {day.holidayNames.length > 0 ? (
        <div className={styles.holidayNames}>{day.holidayNames.join(', ')}</div>
      ) : null}
      <div className={styles.items}>
        {day.tasks.map((task) => (
          <button
            type="button"
            className={`${styles.calendarItem} ${
              isSubscribedTask(task.id) ? styles.readOnlyItem : ''
            }`}
            draggable={!isSubscribedTask(task.id)}
            key={task.id}
            title={task.title}
            onClick={(event) => event.stopPropagation()}
            onDragStart={(event) => {
              if (isSubscribedTask(task.id)) return;
              event.dataTransfer.setData('text/plain', task.id.split(':')[0]);
            }}
          >
            {task.deadlineTime ? `${task.deadlineTime} ` : ''}
            {task.title}
          </button>
        ))}
        {day.localEvents.map((event) => (
          <button
            type="button"
            className={`${styles.calendarItem} ${styles.localEvent}`}
            key={event.id}
            title={event.title}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onLocalEventSelect(event);
            }}
          >
            {event.allDay ? '' : `${event.startsAt.slice(11, 16)} `}
            {event.title}
          </button>
        ))}
        {day.events.map((event) => (
          <button
            type="button"
            className={`${styles.calendarItem} ${styles.event}`}
            key={event.id}
            title={event.title}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onEventSelect(event);
            }}
          >
            {event.allDay ? '' : `${event.startsAt.slice(11, 16)} `}
            {event.title}
          </button>
        ))}
      </div>
      {showCurrentTime && isToday && currentDate === today ? (
        <span className={styles.currentTime} style={{ top: `${currentTimeTop}%` }} />
      ) : null}
    </div>
  );
};

const formatCalendarTitle = (startDate: string, endDate: string): string =>
  startDate === endDate ? startDate : `${startDate} - ${endDate}`;

const formatShortWeekday = (date: string): string =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T00:00:00`));

const isSubscribedTask = (taskId: string): boolean => taskId.startsWith('subscribed:');

const getCurrentTimeTop = (): number => {
  const now = new Date();
  return ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
};
