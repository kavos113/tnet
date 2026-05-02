import { useEffect, useRef } from 'react';
import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';

export const useTaskReminderNotifications = (tasks: TaskItem[]): void => {
  const notifiedTaskIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const notifyDueTasks = (): void => {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => undefined);
        return;
      }
      if (Notification.permission !== 'granted') return;

      const now = Date.now();
      for (const task of tasks) {
        if (!task.deadlineDate || !task.deadlineTime || task.completedAt) continue;
        if (notifiedTaskIds.current.has(task.id)) continue;
        const deadlineMs = new Date(`${task.deadlineDate}T${task.deadlineTime}:00`).getTime();
        const reminderMs = (task.reminderMinutesBefore ?? 0) * 60 * 1000;
        if (deadlineMs - reminderMs <= now && deadlineMs + 60 * 1000 >= now) {
          notifiedTaskIds.current.add(task.id);
          new Notification(task.title, {
            body: task.category ? `${task.deadlineTime} - ${task.category}` : task.deadlineTime
          });
        }
      }
    };

    notifyDueTasks();
    const intervalId = window.setInterval(notifyDueTasks, 60000);
    return () => window.clearInterval(intervalId);
  }, [tasks]);
};
