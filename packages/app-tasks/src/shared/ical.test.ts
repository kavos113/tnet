import { describe, expect, it } from 'vitest';
import {
  expandIcalEvents,
  extractCalDavCalendarData,
  parseIcalCalendar,
  taskToIcalCalendar
} from './ical';

describe('iCal parser', () => {
  it('parses VEVENT fields and unfolds text', () => {
    const [event] = parseIcalCalendar(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-1
SUMMARY:Planning\\, weekly
DTSTART:20260502T100000Z
DTEND:20260502T110000Z
DESCRIPTION:Line one\\nLine two
LOCATION:Room 1
LAST-MODIFIED:20260501T090000Z
END:VEVENT
END:VCALENDAR`);

    expect(event).toMatchObject({
      uid: 'event-1',
      summary: 'Planning, weekly',
      description: 'Line one\nLine two',
      location: 'Room 1',
      startsAt: '2026-05-02T10:00:00.000Z',
      endsAt: '2026-05-02T11:00:00.000Z',
      lastModified: '2026-05-01T09:00:00.000Z'
    });
  });

  it('expands limited RRULE frequencies with COUNT and UNTIL', () => {
    const events = parseIcalCalendar(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:daily
SUMMARY:Standup
DTSTART:20260501T090000Z
DTEND:20260501T093000Z
RRULE:FREQ=DAILY;COUNT=3
END:VEVENT
BEGIN:VEVENT
UID:weekly
SUMMARY:Review
DTSTART:20260501T100000Z
DTEND:20260501T110000Z
RRULE:FREQ=WEEKLY;UNTIL=20260515T000000Z
END:VEVENT
END:VCALENDAR`);

    const occurrences = expandIcalEvents({
      events,
      sourceId: 'source-1',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      now: new Date('2026-05-01T00:00:00.000Z')
    });

    expect(occurrences.map((event) => `${event.uid}:${event.startsAt.slice(0, 10)}`)).toEqual([
      'daily:2026-05-01',
      'daily:2026-05-02',
      'daily:2026-05-03',
      'weekly:2026-05-01',
      'weekly:2026-05-08',
      'weekly:2026-05-15'
    ]);
  });

  it('extracts CalDAV calendar-data payloads', () => {
    expect(
      extractCalDavCalendarData(
        '<d:multistatus><cal:calendar-data>BEGIN:VCALENDAR&amp;END:VCALENDAR</cal:calendar-data></d:multistatus>'
      )
    ).toEqual(['BEGIN:VCALENDAR&END:VCALENDAR']);
  });

  it('serializes deadline tasks as VEVENT calendars for write-back', () => {
    expect(
      taskToIcalCalendar({
        id: 'task-1',
        title: 'Write, review',
        notes: 'Line one\nLine two',
        deadlineDate: '2026-05-02',
        deadlineTime: '09:30',
        recurrenceRule: 'FREQ=WEEKLY',
        sourceUrl: 'file:///notes/today.md',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z'
      })
    ).toContain('SUMMARY:Write\\, review');
  });
});
