import type {
  CalendarEventOccurrence,
  SubscribedTaskOccurrence
} from '@tnet/app-tasks/shared/tasksTypes';
import type { GoogleCalendarEvent } from './googleCalendarService';

export const googleEventToOccurrence = (
  event: GoogleCalendarEvent,
  sourceId: string
): CalendarEventOccurrence[] => {
  const start = googleEventDateTime(event.start);
  if (!start) return [];
  const end = googleEventDateTime(event.end) ?? start;
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
    value: Number.isNaN(date.getTime()) ? value.dateTime : date.toISOString(),
    allDay: false
  };
};
