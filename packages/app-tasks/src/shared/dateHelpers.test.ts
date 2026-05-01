import { describe, expect, it } from 'vitest';
import type { TaskItem } from './tasksTypes';
import {
  addLocalDays,
  compareTaskDeadlines,
  compareUndatedTasks,
  doesDateRangeOverlap,
  isLocalDateString,
  isLocalTimeString,
  isTaskDeadlineInRange,
  toLocalDateString
} from './dateHelpers';

const task = (overrides: Partial<TaskItem>): TaskItem => ({
  id: overrides.id ?? 'task-1',
  title: overrides.title ?? 'Task',
  notes: '',
  createdAt: overrides.createdAt ?? '2026-05-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-05-01T00:00:00.000Z',
  ...overrides
});

describe('tasks date helpers', () => {
  it('formats and validates local dates and times', () => {
    const testCases = [
      { value: '2026-02-28', isDate: true },
      { value: '2026-02-29', isDate: false },
      { value: '2026-13-01', isDate: false }
    ];

    for (const testCase of testCases) {
      expect(isLocalDateString(testCase.value), testCase.value).toBe(testCase.isDate);
    }

    expect(isLocalTimeString('23:59')).toBe(true);
    expect(isLocalTimeString('24:00')).toBe(false);
    expect(toLocalDateString(new Date(2026, 4, 2))).toBe('2026-05-02');
    expect(addLocalDays('2026-05-02', 2)).toBe('2026-05-04');
  });

  it('detects inclusive range overlaps', () => {
    const testCases = [
      { start: '2026-05-01', end: '2026-05-03', expected: true },
      { start: '2026-04-29', end: '2026-05-01', expected: true },
      { start: '2026-05-03', end: undefined, expected: true },
      { start: '2026-05-04', end: undefined, expected: false }
    ];

    for (const testCase of testCases) {
      expect(
        doesDateRangeOverlap(testCase.start, testCase.end, '2026-05-01', '2026-05-03'),
        `${testCase.start}-${testCase.end ?? testCase.start}`
      ).toBe(testCase.expected);
    }
  });

  it('sorts dated tasks before undated tasks by date and time', () => {
    const sorted = [
      task({ id: 'no-deadline', title: 'No deadline' }),
      task({ id: 'late', title: 'Late', deadlineDate: '2026-05-02', deadlineTime: '18:00' }),
      task({ id: 'date-only', title: 'Date only', deadlineDate: '2026-05-02' }),
      task({ id: 'early', title: 'Early', deadlineDate: '2026-05-01', deadlineTime: '09:00' })
    ].sort(compareTaskDeadlines);

    expect(sorted.map((item) => item.id)).toEqual(['early', 'date-only', 'late', 'no-deadline']);
  });

  it('sorts undated tasks with newer open tasks first', () => {
    const sorted = [
      task({ id: 'completed', completedAt: '2026-05-03T00:00:00.000Z' }),
      task({ id: 'old', createdAt: '2026-05-01T00:00:00.000Z' }),
      task({ id: 'new', createdAt: '2026-05-02T00:00:00.000Z' })
    ].sort(compareUndatedTasks);

    expect(sorted.map((item) => item.id)).toEqual(['new', 'old', 'completed']);
  });

  it('checks task deadline ranges', () => {
    expect(
      isTaskDeadlineInRange(task({ deadlineDate: '2026-05-02' }), '2026-05-01', '2026-05-03')
    ).toBe(true);
    expect(isTaskDeadlineInRange(task({}), '2026-05-01', '2026-05-03')).toBe(false);
  });
});
