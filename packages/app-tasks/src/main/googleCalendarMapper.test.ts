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
});
