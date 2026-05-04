import { describe, expect, it } from 'vitest';
import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from './tasksTypes';
import {
  buildVisibleCalendarItems,
  expandRecurringTasksForRange,
  getOccurrenceCacheRange,
  getVisibleCalendarRange,
  groupVisibleCalendarItems,
  isWeekendDate,
  taskItemToCalendarTaskItem
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

const subscribedTask = (
  id: string,
  deadlineDate: string,
  overrides: Partial<SubscribedTaskOccurrence> = {}
): SubscribedTaskOccurrence => ({
  id,
  sourceId: 'task-source',
  uid: id,
  title: id,
  deadlineDate,
  allDay: true,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  ...overrides
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
      tasks: [task('today', '2026-05-02'), task('undated')].map(taskItemToCalendarTaskItem),
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

  it('treats all-day midnight end timestamps as exclusive display bounds', () => {
    const grouped = groupVisibleCalendarItems({
      dates: ['2026-05-02', '2026-05-03', '2026-05-04'],
      currentDate: '2026-05-02',
      tasks: [],
      localEvents: [],
      events: [
        {
          ...event('single-day', '2026-05-02T00:00:00.000', '2026-05-03T00:00:00.000'),
          allDay: true
        },
        {
          ...event('two-day', '2026-05-02T00:00:00.000', '2026-05-04T00:00:00.000'),
          allDay: true
        }
      ]
    });

    expect(grouped.map((day) => day.events.map((item) => item.id))).toEqual([
      ['single-day', 'two-day'],
      ['two-day'],
      []
    ]);
  });

  it('derives holidays from holiday subscription all-day events', () => {
    const grouped = groupVisibleCalendarItems({
      dates: ['2026-05-02'],
      currentDate: '2026-05-02',
      tasks: [],
      sources: [
        {
          id: 'holiday-source',
          name: 'Holidays',
          type: 'ics-url',
          itemKind: 'event',
          purpose: 'holiday',
          uri: 'https://example.test/holidays.ics',
          enabled: true,
          writeBackEnabled: false,
          authType: 'none',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z'
        }
      ],
      events: [
        {
          ...event('holiday', '2026-05-02T00:00:00.000', '2026-05-02T23:59:59.999'),
          sourceId: 'holiday-source',
          title: 'Constitution Day',
          allDay: true
        },
        event('regular', '2026-05-02T10:00:00.000', '2026-05-02T11:00:00.000')
      ]
    });

    expect(grouped[0]).toEqual(
      expect.objectContaining({
        holidayNames: ['Constitution Day'],
        isHoliday: true
      })
    );
    expect(grouped[0].events.map((item) => item.id)).toEqual(['regular']);
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

  it('marks weekend dates', () => {
    expect(isWeekendDate('2026-05-02')).toBe(true);
    expect(isWeekendDate('2026-05-03')).toBe(true);
    expect(isWeekendDate('2026-05-04')).toBe(false);

    const grouped = groupVisibleCalendarItems({
      dates: ['2026-05-02', '2026-05-03', '2026-05-04'],
      currentDate: '2026-05-02',
      tasks: [],
      events: []
    });
    expect(
      grouped.map((day) => ({
        date: day.date,
        holidayNames: day.holidayNames,
        isHoliday: day.isHoliday,
        isSaturday: day.isSaturday,
        isSunday: day.isSunday
      }))
    ).toEqual([
      {
        date: '2026-05-02',
        holidayNames: [],
        isHoliday: false,
        isSaturday: true,
        isSunday: false
      },
      {
        date: '2026-05-03',
        holidayNames: [],
        isHoliday: false,
        isSaturday: false,
        isSunday: true
      },
      {
        date: '2026-05-04',
        holidayNames: [],
        isHoliday: false,
        isSaturday: false,
        isSunday: false
      }
    ]);
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

  it('builds calendar day items from recurring local tasks and subscribed tasks', () => {
    const grouped = buildVisibleCalendarItems({
      dates: ['2026-05-02', '2026-05-03'],
      currentDate: '2026-05-02',
      startDate: '2026-05-02',
      endDate: '2026-05-03',
      tasks: [
        {
          ...task('daily', '2026-05-01'),
          recurrenceRule: 'FREQ=DAILY'
        }
      ],
      subscribedTasks: [subscribedTask('external', '2026-05-03')],
      events: []
    });

    expect(grouped[0].tasks.map((item) => item.id)).toEqual(['daily:2026-05-02']);
    expect(grouped[1].tasks.map((item) => item.id)).toEqual(['daily:2026-05-03', 'external']);
    expect(grouped[1].tasks.map((item) => item.kind)).toEqual(['local-task', 'subscribed-task']);
    expect(grouped[1].tasks[1].task).toMatchObject({
      id: 'external',
      sourceId: 'task-source',
      uid: 'external'
    });
  });
});
