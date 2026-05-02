import { toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';
import type { CalendarDayItems, CalendarTaskItem } from '@tnet/app-tasks/shared/calendarView';
import type { CalendarEventOccurrence, LocalEvent } from '@tnet/app-tasks/shared/tasksTypes';
import {
  accentColorStyle,
  getCalendarTaskAccentColor,
  getSubscribedEventAccentColor
} from '../../utils/taskColors';
import styles from './TasksCalendar.module.css';

export const TasksCalendarCell = ({
  categoryColors,
  currentDate,
  day,
  sourceColors,
  showCurrentTime,
  onDateSelect,
  onEventSelect,
  onLocalEventSelect,
  onRescheduleTask,
  onTaskSelect
}: {
  categoryColors: Record<string, string>;
  currentDate: string;
  day: CalendarDayItems;
  sourceColors: Record<string, string>;
  showCurrentTime: boolean;
  onDateSelect: (date: string) => void;
  onEventSelect: (event: CalendarEventOccurrence) => void;
  onLocalEventSelect: (event: LocalEvent) => void;
  onRescheduleTask: (taskId: string, date: string) => void;
  onTaskSelect: (task: CalendarTaskItem) => void;
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
          <TaskCalendarItem
            key={task.id}
            task={task}
            accentColor={getCalendarTaskAccentColor(task, categoryColors, sourceColors)}
            onTaskSelect={onTaskSelect}
          />
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
            style={accentColorStyle(getSubscribedEventAccentColor(event, sourceColors))}
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

const TaskCalendarItem = ({
  task,
  accentColor,
  onTaskSelect
}: {
  task: CalendarTaskItem;
  accentColor?: string;
  onTaskSelect: (task: CalendarTaskItem) => void;
}): React.JSX.Element => {
  const isReadOnly = task.kind === 'subscribed-task';

  return (
    <button
      type="button"
      className={`${styles.calendarItem} ${isReadOnly ? styles.readOnlyItem : ''}`}
      draggable={!isReadOnly}
      style={accentColorStyle(accentColor)}
      title={task.title}
      onClick={(event) => {
        event.stopPropagation();
        onTaskSelect(task);
      }}
      onDragStart={(event) => {
        if (isReadOnly) return;
        event.dataTransfer.setData('text/plain', task.task.id.split(':')[0]);
      }}
    >
      {task.deadlineTime ? `${task.deadlineTime} ` : ''}
      {task.title}
    </button>
  );
};

const formatShortWeekday = (date: string): string =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T00:00:00`));

const getCurrentTimeTop = (): number => {
  const now = new Date();
  return ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;
};
