import type {
  CalendarEventOccurrence,
  SubscribedTaskOccurrence
} from '@tnet/app-tasks/shared/tasksTypes';
import { addLocalDays } from '@tnet/app-tasks/shared/dateHelpers';
import type { GoogleCalendarEvent } from './googleCalendarService';

const googleCalendarDisplayTimeZone = 'Asia/Tokyo';

export const googleEventToOccurrence = (
  event: GoogleCalendarEvent,
  sourceId: string
): CalendarEventOccurrence[] => {
  const start = googleEventDateTime(event.start);
  if (!start) return [];
  const end = normalizeGoogleEventEnd(start, googleEventDateTime(event.end));
  const now = new Date().toISOString();
  return [
    {
      id: '',
      sourceId,
      uid: event.iCalUID || event.id || start.value,
      title: event.summary || '(No title)',
      startsAt: start.value,
      endsAt: end.value,
      allDay: start.allDay,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      recurrenceId: event.recurringEventId ?? undefined,
      lastModified: event.updated ?? undefined,
      createdAt: now,
      updatedAt: now
    }
  ];
};

export const googleEventToSubscribedTaskOccurrence = (
  event: GoogleCalendarEvent,
  sourceId: string
): SubscribedTaskOccurrence[] => {
  const start = googleEventDateTime(event.start);
  if (!start) return [];
  const now = new Date().toISOString();
  return [
    {
      id: '',
      sourceId,
      uid: event.iCalUID || event.id || start.value,
      title: event.summary || '(No title)',
      deadlineDate: start.value.slice(0, 10),
      deadlineTime: start.allDay ? undefined : start.value.slice(11, 16),
      allDay: start.allDay,
      description: event.description ?? undefined,
      recurrenceId: event.recurringEventId ?? undefined,
      lastModified: event.updated ?? undefined,
      createdAt: now,
      updatedAt: now
    }
  ];
};

const googleEventDateTime = (
  value: GoogleCalendarEvent['start'] | GoogleCalendarEvent['end']
): { value: string; allDay: boolean } | undefined => {
  if (!value) return undefined;
  if (value.date) return { value: `${value.date}T00:00:00.000`, allDay: true };
  if (!value.dateTime) return undefined;
  const date = new Date(value.dateTime);
  return {
    value: Number.isNaN(date.getTime())
      ? value.dateTime
      : formatDateInGoogleCalendarDisplayTimeZone(date),
    allDay: false
  };
};

const formatDateInGoogleCalendarDisplayTimeZone = (date: Date): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: googleCalendarDisplayTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}`;
};

const normalizeGoogleEventEnd = (
  start: { value: string; allDay: boolean },
  end: { value: string; allDay: boolean } | undefined
): { value: string; allDay: boolean } => {
  if (!end) return start;
  if (!start.allDay || !end.allDay) return end;

  const startDate = start.value.slice(0, 10);
  const endDate = end.value.slice(0, 10);
  if (endDate <= startDate) return end;

  return {
    value: `${addLocalDays(endDate, -1)}T23:59:59.999`,
    allDay: true
  };
};
