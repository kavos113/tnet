import { describe, expect, it } from 'vitest';
import type { CalendarEventOccurrence, LocalEvent, TaskItem } from './tasksTypes';
import {
  expandRecurringTasksForRange,
  getOccurrenceCacheRange,
  getVisibleCalendarRange,
  groupVisibleCalendarItems
} from './calendarView';

const task = (id: string, deadlineDate?: string): TaskItem => ({
  id,
  title: id,
  notes: '',
  deadlineDate,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
});

const event = (
  id: string,
  startsAt: string,
  endsAt: string = startsAt
): CalendarEventOccurrence => ({
  id,
  sourceId: 'source-1',
  uid: id,
  title: id,
  startsAt,
  endsAt,
  allDay: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
});

const localEvent = (id: string, startsAt: string, endsAt: string = startsAt): LocalEvent => ({
  id,
  title: id,
  startsAt,
  endsAt,
  allDay: false,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z'
});

describe('calendar view helpers', () => {
  it('builds visible ranges for today, week, and month', () => {
    const testCases = [
      {
        view: 'today' as const,
        expectedStart: '2026-05-02',
        expectedLength: 1
      },
      {
        view: 'week' as const,
        expectedStart: '2026-04-27',
        expectedLength: 7
      },
      {
        view: 'month' as const,
        expectedStart: '2026-04-27',
        expectedLength: 42
      }
    ];

    for (const testCase of testCases) {
      const range = getVisibleCalendarRange('2026-05-02', testCase.view, 1);
      expect(range.startDate, testCase.view).toBe(testCase.expectedStart);
      expect(range.dates, testCase.view).toHaveLength(testCase.expectedLength);
    }
  });

  it('groups tasks and range-overlapping events per visible day', () => {
    const grouped = groupVisibleCalendarItems({
      dates: ['2026-05-02', '2026-05-03'],
      currentDate: '2026-05-02',
      tasks: [task('today', '2026-05-02'), task('undated')],
      localEvents: [
        localEvent('owned-single', '2026-05-02T09:00:00.000', '2026-05-02T10:00:00.000'),
        localEvent('owned-multi', '2026-05-02T23:00:00.000', '2026-05-03T01:00:00.000')
      ],
      events: [
        event('single', '2026-05-02T10:00:00.000', '2026-05-02T11:00:00.000'),
        event('multi', '2026-05-02T23:00:00.000', '2026-05-03T01:00:00.000')
      ]
    });

    expect(grouped[0].tasks.map((item) => item.id)).toEqual(['today']);
    expect(grouped[0].localEvents.map((item) => item.id)).toEqual(['owned-single', 'owned-multi']);
    expect(grouped[1].localEvents.map((item) => item.id)).toEqual(['owned-multi']);
    expect(grouped[0].events.map((item) => item.id)).toEqual(['single', 'multi']);
    expect(grouped[1].events.map((item) => item.id)).toEqual(['multi']);
  });

  it('marks month grid dates outside the current month', () => {
    const grouped = groupVisibleCalendarItems({
      dates: ['2026-04-30', '2026-05-01', '2026-06-01'],
      currentDate: '2026-05-02',
      tasks: [],
      events: []
    });

    expect(grouped.map((day) => day.isOutsideCurrentMonth)).toEqual([true, false, true]);
  });

  it('uses six months before and twelve months after for occurrence cache range', () => {
    expect(getOccurrenceCacheRange(new Date(2026, 4, 2))).toEqual({
      startDate: '2025-11-02',
      endDate: '2027-05-02'
    });
  });

  it('expands local recurring tasks inside the visible range', () => {
    expect(
      expandRecurringTasksForRange(
        [task('daily', '2026-05-01')].map((item) => ({
          ...item,
          recurrenceRule: 'FREQ=DAILY'
        })),
        '2026-05-02',
        '2026-05-04'
      ).map((item) => item.deadlineDate)
    ).toEqual(['2026-05-02', '2026-05-03', '2026-05-04']);
  });
});
