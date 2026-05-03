import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { useTaskReminderNotifications } from './useTaskReminderNotifications';

const originalNotification = globalThis.Notification;

const task = (overrides: Partial<TaskItem>): TaskItem => ({
  id: 'task-1',
  title: 'Task',
  notes: '',
  createdAt: '2026-05-03T00:00:00Z',
  updatedAt: '2026-05-03T00:00:00Z',
  ...overrides
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-03T10:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.Notification = originalNotification;
  vi.restoreAllMocks();
});

describe('useTaskReminderNotifications', () => {
  it('does nothing when Notification is unavailable', () => {
    globalThis.Notification = undefined as never;

    const { unmount } = renderHook(() =>
      useTaskReminderNotifications([
        task({ deadlineDate: '2026-05-03', deadlineTime: '10:00', category: 'Work' })
      ])
    );

    expect(() => vi.advanceTimersByTime(60000)).not.toThrow();
    unmount();
  });

  it('requests permission when the browser has not decided yet', () => {
    const requestPermission = vi.fn(async () => 'denied' as NotificationPermission);
    globalThis.Notification = Object.assign(vi.fn(), {
      permission: 'default' as NotificationPermission,
      requestPermission
    }) as never;

    const { unmount } = renderHook(() =>
      useTaskReminderNotifications([
        task({ deadlineDate: '2026-05-03', deadlineTime: '10:00', category: 'Work' })
      ])
    );

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(globalThis.Notification).not.toHaveBeenCalled();
    unmount();
  });

  it('notifies due tasks once and skips incomplete or completed reminders', () => {
    const notification = vi.fn();
    globalThis.Notification = Object.assign(notification, {
      permission: 'granted' as NotificationPermission,
      requestPermission: vi.fn()
    }) as never;

    const { unmount } = renderHook(() =>
      useTaskReminderNotifications([
        task({
          id: 'due-with-category',
          title: 'Due with category',
          deadlineDate: '2026-05-03',
          deadlineTime: '10:00',
          category: 'Work'
        }),
        task({
          id: 'due-without-category',
          title: 'Due without category',
          deadlineDate: '2026-05-03',
          deadlineTime: '10:00'
        }),
        task({ id: 'missing-time', title: 'Missing time', deadlineDate: '2026-05-03' }),
        task({
          id: 'completed',
          title: 'Completed',
          deadlineDate: '2026-05-03',
          deadlineTime: '10:00',
          completedAt: '2026-05-03T09:00:00Z'
        }),
        task({
          id: 'future',
          title: 'Future',
          deadlineDate: '2026-05-03',
          deadlineTime: '10:30',
          reminderMinutesBefore: 5
        })
      ])
    );

    expect(notification).toHaveBeenCalledTimes(2);
    expect(notification).toHaveBeenCalledWith('Due with category', {
      body: '10:00 - Work'
    });
    expect(notification).toHaveBeenCalledWith('Due without category', {
      body: '10:00'
    });

    vi.advanceTimersByTime(60000);
    expect(notification).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('does not notify when permission is denied', () => {
    const notification = vi.fn();
    globalThis.Notification = Object.assign(notification, {
      permission: 'denied' as NotificationPermission,
      requestPermission: vi.fn()
    }) as never;

    const { unmount } = renderHook(() =>
      useTaskReminderNotifications([task({ deadlineDate: '2026-05-03', deadlineTime: '10:00' })])
    );

    expect(notification).not.toHaveBeenCalled();
    unmount();
  });
});
