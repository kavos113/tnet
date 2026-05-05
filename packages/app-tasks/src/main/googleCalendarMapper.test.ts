import { describe, expect, it } from 'vitest';
import {
  googleEventToOccurrence,
  googleEventToSubscribedTaskOccurrence
} from './googleCalendarMapper';

describe('Google Calendar mapper', () => {
  it('normalizes date-only event ends to inclusive all-day bounds', () => {
    const testCases = [
      {
        name: 'single day',
        endDate: '2026-05-03',
        expectedEndsAt: '2026-05-02T23:59:59.999'
      },
      {
        name: 'multiple days',
        endDate: '2026-05-04',
        expectedEndsAt: '2026-05-03T23:59:59.999'
      }
    ];

    for (const testCase of testCases) {
      const [occurrence] = googleEventToOccurrence(
        {
          id: testCase.name,
          summary: testCase.name,
          start: { date: '2026-05-02' },
          end: { date: testCase.endDate }
        },
        'source-1'
      );

      expect(occurrence, testCase.name).toMatchObject({
        startsAt: '2026-05-02T00:00:00.000',
        endsAt: testCase.expectedEndsAt,
        allDay: true
      });
    }
  });

  it('maps date-only Google task events as all-day subscribed tasks', () => {
    const [occurrence] = googleEventToSubscribedTaskOccurrence(
      {
        id: 'task-1',
        summary: 'All-day deadline',
        start: { date: '2026-05-02' },
        end: { date: '2026-05-03' }
      },
      'source-1'
    );

    expect(occurrence).toMatchObject({
      deadlineDate: '2026-05-02',
      deadlineTime: undefined,
      allDay: true
    });
  });

  it('maps Google event date-times to JST local timestamps', () => {
    const testCases = [
      {
        name: 'UTC event',
        start: '2026-05-02T10:00:00Z',
        end: '2026-05-02T11:30:00Z',
        expectedStartsAt: '2026-05-02T19:00:00.000',
        expectedEndsAt: '2026-05-02T20:30:00.000'
      },
      {
        name: 'offset event',
        start: '2026-05-02T10:00:00-04:00',
        end: '2026-05-02T11:00:00-04:00',
        expectedStartsAt: '2026-05-02T23:00:00.000',
        expectedEndsAt: '2026-05-03T00:00:00.000'
      }
    ];

    for (const testCase of testCases) {
      const [occurrence] = googleEventToOccurrence(
        {
          id: testCase.name,
          summary: testCase.name,
          start: { dateTime: testCase.start },
          end: { dateTime: testCase.end }
        },
        'source-1'
      );

      expect(occurrence, testCase.name).toMatchObject({
        startsAt: testCase.expectedStartsAt,
        endsAt: testCase.expectedEndsAt,
        allDay: false
      });
    }
  });

  it('maps Google task event date-times to JST deadlines', () => {
    const [occurrence] = googleEventToSubscribedTaskOccurrence(
      {
        id: 'task-1',
        summary: 'Timed deadline',
        start: { dateTime: '2026-05-02T09:30:00Z' },
        end: { dateTime: '2026-05-02T10:00:00Z' }
      },
      'source-1'
    );

    expect(occurrence).toMatchObject({
      deadlineDate: '2026-05-02',
      deadlineTime: '18:30',
      allDay: false
    });
  });
});
