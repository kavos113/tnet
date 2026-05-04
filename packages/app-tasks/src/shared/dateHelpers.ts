import type { TaskItem } from './tasksTypes';

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const localTimePattern = /^\d{2}:\d{2}$/;

const pad = (value: number): string => String(value).padStart(2, '0');

export const toLocalDateString = (date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseLocalDate = (value: string | undefined): Date | undefined => {
  if (!value || !localDatePattern.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
};

export const isLocalDateString = (value: string | undefined): value is string =>
  Boolean(parseLocalDate(value));

export const isLocalTimeString = (value: string | undefined): value is string => {
  if (!value || !localTimePattern.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

export const addLocalDays = (date: string, days: number): string => {
  const parsed = parseLocalDate(date);
  if (!parsed) return date;
  parsed.setDate(parsed.getDate() + days);
  return toLocalDateString(parsed);
};

export const compareLocalDates = (first: string, second: string): number =>
  first.localeCompare(second);

export const doesDateRangeOverlap = (
  startDate: string,
  endDate: string | undefined,
  rangeStartDate: string,
  rangeEndDate: string
): boolean => {
  const normalizedEndDate = endDate ?? startDate;
  return startDate <= rangeEndDate && normalizedEndDate >= rangeStartDate;
};

export const calendarEventDisplayDateRange = (event: {
  startsAt: string;
  endsAt: string;
  allDay: boolean;
}): { startDate: string; endDate: string } => {
  const startDate = event.startsAt.slice(0, 10);
  const endDate = event.endsAt.slice(0, 10);
  if (event.allDay && startDate < endDate && isMidnightTimestamp(event.endsAt)) {
    return {
      startDate,
      endDate: addLocalDays(endDate, -1)
    };
  }
  return {
    startDate,
    endDate
  };
};

export const taskHasDeadline = (task: Pick<TaskItem, 'deadlineDate'>): boolean =>
  Boolean(task.deadlineDate);

export const isTaskDeadlineInRange = (
  task: Pick<TaskItem, 'deadlineDate'>,
  startDate: string,
  endDate: string
): boolean =>
  Boolean(
    task.deadlineDate &&
    doesDateRangeOverlap(task.deadlineDate, task.deadlineDate, startDate, endDate)
  );

export const compareTaskDeadlines = (first: TaskItem, second: TaskItem): number => {
  if (!first.deadlineDate && !second.deadlineDate) return compareUndatedTasks(first, second);
  if (!first.deadlineDate) return 1;
  if (!second.deadlineDate) return -1;

  const dateComparison = compareLocalDates(first.deadlineDate, second.deadlineDate);
  if (dateComparison !== 0) return dateComparison;

  const firstTime = first.deadlineTime ?? '';
  const secondTime = second.deadlineTime ?? '';
  const timeComparison = firstTime.localeCompare(secondTime);
  if (timeComparison !== 0) return timeComparison;

  return compareStableTaskFields(first, second);
};

export const compareUndatedTasks = (first: TaskItem, second: TaskItem): number => {
  const firstCompleted = Boolean(first.completedAt);
  const secondCompleted = Boolean(second.completedAt);
  if (firstCompleted !== secondCompleted) return firstCompleted ? 1 : -1;

  const createdComparison = second.createdAt.localeCompare(first.createdAt);
  if (createdComparison !== 0) return createdComparison;

  return compareStableTaskFields(first, second);
};

const compareStableTaskFields = (first: TaskItem, second: TaskItem): number => {
  const titleComparison = first.title.localeCompare(second.title);
  if (titleComparison !== 0) return titleComparison;
  return first.id.localeCompare(second.id);
};

const isMidnightTimestamp = (value: string): boolean =>
  /^T00:00:00\.000(?:Z)?$/.test(value.slice(10));
