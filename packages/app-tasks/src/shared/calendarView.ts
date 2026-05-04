import {
  addLocalDays,
  calendarEventDisplayDateRange,
  doesDateRangeOverlap,
  toLocalDateString
} from '@tnet/app-tasks/shared/dateHelpers';
import type { TasksDefaultView } from './config';
import type {
  CalendarEventOccurrence,
  CalendarSource,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from './tasksTypes';

export interface CalendarDateRange {
  startDate: string;
  endDate: string;
  dates: string[];
}

export interface CalendarDayItems {
  date: string;
  holidayNames: string[];
  isHoliday: boolean;
  isOutsideCurrentMonth: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  isWeekend: boolean;
  tasks: CalendarTaskItem[];
  localEvents: LocalEvent[];
  events: CalendarEventOccurrence[];
}

export type CalendarTaskItem =
  | {
      kind: 'local-task';
      id: string;
      title: string;
      deadlineDate?: string;
      deadlineTime?: string;
      completedAt?: string;
      task: TaskItem;
    }
  | {
      kind: 'subscribed-task';
      id: string;
      title: string;
      deadlineDate: string;
      deadlineTime?: string;
      completedAt?: string;
      task: SubscribedTaskOccurrence;
    };

export interface BuildVisibleCalendarItemsInput {
  dates: string[];
  currentDate: string;
  startDate: string;
  endDate: string;
  tasks: TaskItem[];
  subscribedTasks?: SubscribedTaskOccurrence[];
  localEvents?: LocalEvent[];
  events: CalendarEventOccurrence[];
  sources?: CalendarSource[];
}

export const getVisibleCalendarRange = (
  currentDate: string,
  view: TasksDefaultView,
  weekStartsOn: number
): CalendarDateRange => {
  const dates = getVisibleCalendarDates(currentDate, view, weekStartsOn);
  return {
    startDate: dates[0] ?? currentDate,
    endDate: dates[dates.length - 1] ?? currentDate,
    dates
  };
};

export const getVisibleCalendarDates = (
  currentDate: string,
  view: TasksDefaultView,
  weekStartsOn: number
): string[] => {
  if (view === 'today') return [currentDate];
  if (view === 'month') return getMonthDates(currentDate, weekStartsOn);

  const current = new Date(`${currentDate}T00:00:00`);
  const offset = (current.getDay() - weekStartsOn + 7) % 7;
  const startDate = addLocalDays(currentDate, -offset);
  return Array.from({ length: 7 }, (_, index) => addLocalDays(startDate, index));
};

export const groupVisibleCalendarItems = ({
  dates,
  currentDate,
  tasks,
  localEvents = [],
  events,
  sources = []
}: {
  dates: string[];
  currentDate: string;
  tasks: CalendarTaskItem[];
  localEvents?: LocalEvent[];
  events: CalendarEventOccurrence[];
  sources?: CalendarSource[];
}): CalendarDayItems[] => {
  const holidaySourceIds = new Set(
    sources.filter((source) => source.purpose === 'holiday').map((source) => source.id)
  );

  return dates.map((date) => {
    const holidayEvents = events.filter(
      (event) =>
        event.allDay && holidaySourceIds.has(event.sourceId) && doesEventOverlapDate(event, date)
    );
    return {
      date,
      holidayNames: holidayEvents.map((event) => event.title),
      isHoliday: holidayEvents.length > 0,
      isOutsideCurrentMonth: date.slice(0, 7) !== currentDate.slice(0, 7),
      isSaturday: getLocalDayOfWeek(date) === 6,
      isSunday: getLocalDayOfWeek(date) === 0,
      isWeekend: isWeekendDate(date),
      tasks: tasks.filter((task) => task.deadlineDate === date),
      localEvents: localEvents.filter((event) => doesEventOverlapDate(event, date)),
      events: events.filter(
        (event) => !holidaySourceIds.has(event.sourceId) && doesEventOverlapDate(event, date)
      )
    };
  });
};

const doesEventOverlapDate = (
  event: Pick<CalendarEventOccurrence | LocalEvent, 'startsAt' | 'endsAt' | 'allDay'>,
  date: string
): boolean => {
  const range = calendarEventDisplayDateRange(event);
  return doesDateRangeOverlap(range.startDate, range.endDate, date, date);
};

export const buildVisibleCalendarItems = ({
  dates,
  currentDate,
  startDate,
  endDate,
  tasks,
  subscribedTasks = [],
  localEvents = [],
  events,
  sources = []
}: BuildVisibleCalendarItemsInput): CalendarDayItems[] =>
  groupVisibleCalendarItems({
    dates,
    currentDate,
    tasks: [
      ...expandRecurringTasksForRange(tasks, startDate, endDate).map(taskItemToCalendarTaskItem),
      ...subscribedTasks.map(subscribedTaskOccurrenceToCalendarTaskItem)
    ],
    localEvents,
    events,
    sources
  });

export const taskItemToCalendarTaskItem = (task: TaskItem): CalendarTaskItem => ({
  kind: 'local-task',
  id: task.id,
  title: task.title,
  deadlineDate: task.deadlineDate,
  deadlineTime: task.deadlineTime,
  completedAt: task.completedAt,
  task
});

export const subscribedTaskOccurrenceToCalendarTaskItem = (
  task: SubscribedTaskOccurrence
): CalendarTaskItem => ({
  kind: 'subscribed-task',
  id: task.id,
  title: task.title,
  deadlineDate: task.deadlineDate,
  deadlineTime: task.deadlineTime,
  completedAt: task.completedAt,
  task
});

export const isWeekendDate = (date: string): boolean => {
  const day = getLocalDayOfWeek(date);
  return day === 0 || day === 6;
};

const getLocalDayOfWeek = (date: string): number => new Date(`${date}T00:00:00`).getDay();

export const expandRecurringTasksForRange = (
  tasks: TaskItem[],
  startDate: string,
  endDate: string
): TaskItem[] =>
  tasks.flatMap((task) => {
    if (!task.deadlineDate || !task.recurrenceRule) return [task];
    const frequency = parseTaskRecurrenceFrequency(task.recurrenceRule);
    if (!frequency) return [task];

    const expanded: TaskItem[] = [];
    let date = task.deadlineDate;
    let index = 0;
    while (date <= endDate && index < 500) {
      if (date >= startDate) {
        expanded.push({
          ...task,
          id: `${task.id}:${date}`,
          deadlineDate: date
        });
      }
      date =
        frequency === 'DAILY'
          ? addLocalDays(date, 1)
          : frequency === 'WEEKLY'
            ? addLocalDays(date, 7)
            : addOneMonth(date);
      index += 1;
    }
    return expanded;
  });

export const getOccurrenceCacheRange = (
  date = new Date()
): { startDate: string; endDate: string } => {
  const start = new Date(date);
  start.setMonth(start.getMonth() - 6);
  const end = new Date(date);
  end.setMonth(end.getMonth() + 12);
  return {
    startDate: toLocalDateString(start),
    endDate: toLocalDateString(end)
  };
};

const getMonthDates = (currentDate: string, weekStartsOn: number): string[] => {
  const current = new Date(`${currentDate}T00:00:00`);
  const firstOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const firstDate = toLocalDateString(firstOfMonth);
  const leadingOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addLocalDays(firstDate, -leadingOffset);
  return Array.from({ length: 42 }, (_, index) => addLocalDays(gridStart, index));
};

const parseTaskRecurrenceFrequency = (
  value: string
): 'DAILY' | 'WEEKLY' | 'MONTHLY' | undefined => {
  if (value.includes('FREQ=DAILY')) return 'DAILY';
  if (value.includes('FREQ=WEEKLY')) return 'WEEKLY';
  if (value.includes('FREQ=MONTHLY')) return 'MONTHLY';
  return undefined;
};

const addOneMonth = (date: string): string => {
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setMonth(parsed.getMonth() + 1);
  return toLocalDateString(parsed);
};
