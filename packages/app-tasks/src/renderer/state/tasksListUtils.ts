import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';

export const upsertTaskInList = (tasks: TaskItem[], task: TaskItem): TaskItem[] => {
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index < 0) return [...tasks, task];
  return tasks.map((item) => (item.id === task.id ? task : item));
};
