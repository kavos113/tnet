import { addLocalDays, doesDateRangeOverlap, toLocalDateString } from './dateHelpers';
import type { CalendarEventOccurrence, TaskItem } from './tasksTypes';

export interface IcalEvent {
  uid: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  description?: string;
  location?: string;
  lastModified?: string;
  rrule?: IcalRecurrenceRule;
}

export interface IcalRecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  count?: number;
  until?: string;
}

interface IcalProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

export const parseIcalCalendar = (text: string): IcalEvent[] => {
  const lines = unfoldIcalLines(text);
  const events: IcalProperty[][] = [];
  let currentEvent: IcalProperty[] | undefined;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = [];
      continue;
    }
    if (line === 'END:VEVENT') {
      if (currentEvent) events.push(currentEvent);
      currentEvent = undefined;
      continue;
    }
    if (currentEvent) currentEvent.push(parseIcalProperty(line));
  }

  return events.flatMap((properties) => {
    const uid = getPropertyValue(properties, 'UID');
    const summary = getPropertyValue(properties, 'SUMMARY');
    const startProperty = getProperty(properties, 'DTSTART');
    const endProperty = getProperty(properties, 'DTEND');
    if (!uid || !startProperty) return [];

    const start = parseIcalDateTime(startProperty);
    const end = endProperty ? parseIcalDateTime(endProperty) : undefined;
    const endsAt =
      end?.value ??
      (start.allDay ? `${addLocalDays(start.value.slice(0, 10), 1)}T00:00:00.000` : start.value);

    return [
      {
        uid,
        summary: summary || '(No title)',
        startsAt: start.value,
        endsAt,
        allDay: start.allDay,
        description: getPropertyValue(properties, 'DESCRIPTION') || undefined,
        location: getPropertyValue(properties, 'LOCATION') || undefined,
        lastModified: normalizeIcalTimestamp(getPropertyValue(properties, 'LAST-MODIFIED')),
        rrule: parseRrule(getPropertyValue(properties, 'RRULE'))
      }
    ];
  });
};

export const expandIcalEvents = ({
  events,
  sourceId,
  startDate,
  endDate,
  now = new Date()
}: {
  events: IcalEvent[];
  sourceId: string;
  startDate: string;
  endDate: string;
  now?: Date;
}): CalendarEventOccurrence[] => {
  const timestamp = now.toISOString();
  return events.flatMap((event) => {
    const startsOn = event.startsAt.slice(0, 10);
    const endsOn = event.endsAt.slice(0, 10);
    if (!event.rrule) {
      return doesDateRangeOverlap(startsOn, endsOn, startDate, endDate)
        ? [toOccurrence(event, sourceId, event.startsAt, event.endsAt, undefined, timestamp)]
        : [];
    }

    return expandRecurringEvent(event, sourceId, startDate, endDate, timestamp);
  });
};

export const extractCalDavCalendarData = (text: string): string[] => {
  const matches = text.matchAll(
    /<(?:[^:>]+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:[^:>]+:)?calendar-data>/gi
  );
  return [...matches].map((match) => decodeXmlEntities(match[1]));
};

export const taskToIcalCalendar = (task: TaskItem): string => {
  if (!task.deadlineDate) throw new Error('Task must have a deadline date to export.');
  const uid = taskToIcalUid(task);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tnet//Tasks//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${escapeIcalText(task.title)}`,
    ...taskToIcalDateLines(task),
    task.notes ? `DESCRIPTION:${escapeIcalText(task.notes)}` : undefined,
    task.sourceUrl ? `URL:${escapeIcalText(task.sourceUrl)}` : undefined,
    task.recurrenceRule ? `RRULE:${task.recurrenceRule}` : undefined,
    `LAST-MODIFIED:${formatIcalUtcTimestamp(task.updatedAt)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter((line): line is string => Boolean(line));
  return `${lines.join('\r\n')}\r\n`;
};

export const taskToIcalUid = (task: TaskItem): string => `tnet-task-${task.id}`;

const expandRecurringEvent = (
  event: IcalEvent,
  sourceId: string,
  startDate: string,
  endDate: string,
  timestamp: string
): CalendarEventOccurrence[] => {
  if (!event.rrule) return [];
  const occurrences: CalendarEventOccurrence[] = [];
  const durationMs = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
  let occurrenceStart = event.startsAt;
  let emitted = 0;
  let attempted = 0;
  const maxAttempts = 2000;

  while (attempted < maxAttempts) {
    attempted += 1;
    const occurrenceStartDate = occurrenceStart.slice(0, 10);
    if (event.rrule.until && occurrenceStartDate > event.rrule.until) break;
    if (event.rrule.count && attempted > event.rrule.count) break;
    if (occurrenceStartDate > endDate) break;

    const occurrenceEnd = new Date(new Date(occurrenceStart).getTime() + durationMs).toISOString();
    if (doesDateRangeOverlap(occurrenceStartDate, occurrenceEnd.slice(0, 10), startDate, endDate)) {
      emitted += 1;
      occurrences.push(
        toOccurrence(event, sourceId, occurrenceStart, occurrenceEnd, String(emitted), timestamp)
      );
    }

    occurrenceStart = addRecurrenceStep(occurrenceStart, event.rrule.frequency);
  }

  return occurrences;
};

const toOccurrence = (
  event: IcalEvent,
  sourceId: string,
  startsAt: string,
  endsAt: string,
  recurrenceId: string | undefined,
  timestamp: string
): CalendarEventOccurrence => ({
  id: `${sourceId}:${event.uid}:${startsAt}:${recurrenceId ?? ''}`,
  sourceId,
  uid: event.uid,
  title: event.summary,
  startsAt,
  endsAt,
  allDay: event.allDay,
  description: event.description,
  location: event.location,
  recurrenceId,
  lastModified: event.lastModified,
  createdAt: timestamp,
  updatedAt: timestamp
});

const addRecurrenceStep = (
  startsAt: string,
  frequency: IcalRecurrenceRule['frequency']
): string => {
  const date = new Date(startsAt);
  if (frequency === 'DAILY') date.setDate(date.getDate() + 1);
  if (frequency === 'WEEKLY') date.setDate(date.getDate() + 7);
  if (frequency === 'MONTHLY') date.setMonth(date.getMonth() + 1);
  return date.toISOString();
};

const taskToIcalDateLines = (task: TaskItem): string[] => {
  if (!task.deadlineDate) return [];
  if (!task.deadlineTime) {
    return [
      `DTSTART;VALUE=DATE:${compactDate(task.deadlineDate)}`,
      `DTEND;VALUE=DATE:${compactDate(addLocalDays(task.deadlineDate, 1))}`
    ];
  }

  const start = new Date(`${task.deadlineDate}T${task.deadlineTime}:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return [`DTSTART:${formatIcalLocalTimestamp(start)}`, `DTEND:${formatIcalLocalTimestamp(end)}`];
};

const formatIcalUtcTimestamp = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? formatIcalLocalTimestamp(new Date(), true)
    : formatIcalLocalTimestamp(date, true);
};

const formatIcalLocalTimestamp = (date: Date, utc = false): string => {
  const values = utc
    ? [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
      ]
    : [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ];
  const [year, month, day, hour, minute, second] = values.map((value) =>
    String(value).padStart(2, '0')
  );
  return `${year}${month}${day}T${hour}${minute}${second}${utc ? 'Z' : ''}`;
};

const compactDate = (date: string): string => date.replace(/-/g, '');

const unfoldIcalLines = (text: string): string[] => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      unfolded[unfolded.length - 1] = `${unfolded[unfolded.length - 1] ?? ''}${line.slice(1)}`;
    } else if (line.trim()) {
      unfolded.push(line.trim());
    }
  }
  return unfolded;
};

const parseIcalProperty = (line: string): IcalProperty => {
  const separatorIndex = line.indexOf(':');
  const key = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
  const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
  const [name, ...paramParts] = key.split(';');
  const params = Object.fromEntries(
    paramParts.map((part) => {
      const [paramName, paramValue = ''] = part.split('=');
      return [paramName.toUpperCase(), paramValue];
    })
  );
  return {
    name: name.toUpperCase(),
    params,
    value: unescapeIcalText(value)
  };
};

const getProperty = (properties: IcalProperty[], name: string): IcalProperty | undefined =>
  properties.find((property) => property.name === name);

const getPropertyValue = (properties: IcalProperty[], name: string): string | undefined =>
  getProperty(properties, name)?.value;

const parseIcalDateTime = (property: IcalProperty): { value: string; allDay: boolean } => {
  const value = property.value;
  const allDay = property.params.VALUE === 'DATE' || /^\d{8}$/.test(value);
  if (allDay) return { value: `${formatCompactDate(value)}T00:00:00.000`, allDay: true };
  return { value: normalizeIcalTimestamp(value) ?? value, allDay: false };
};

const normalizeIcalTimestamp = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute, second, utc] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000${utc ? 'Z' : ''}`;
  return utc ? new Date(iso).toISOString() : iso;
};

const formatCompactDate = (value: string): string =>
  `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;

const parseRrule = (value: string | undefined): IcalRecurrenceRule | undefined => {
  if (!value) return undefined;
  const parts = Object.fromEntries(
    value.split(';').map((part) => {
      const [key, partValue = ''] = part.split('=');
      return [key.toUpperCase(), partValue];
    })
  );
  const frequency = parts.FREQ;
  if (frequency !== 'DAILY' && frequency !== 'WEEKLY' && frequency !== 'MONTHLY') {
    return undefined;
  }
  return {
    frequency,
    count: parts.COUNT ? Number(parts.COUNT) : undefined,
    until: parts.UNTIL ? compactDateFromTimestamp(parts.UNTIL) : undefined
  };
};

const compactDateFromTimestamp = (value: string): string => {
  if (/^\d{8}$/.test(value)) return formatCompactDate(value);
  return normalizeIcalTimestamp(value)?.slice(0, 10) ?? toLocalDateString();
};

const unescapeIcalText = (value: string): string =>
  value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

const escapeIcalText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

const decodeXmlEntities = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
