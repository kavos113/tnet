import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { draftFromTask, emptyTaskDraft, type TaskDraft } from './tasksDraft';
import { emptyLocalEventDraft, type LocalEventDraft } from './localEventDraft';

export type TasksDetailsPanelState =
  | { type: 'task' }
  | { type: 'event' }
  | { type: 'task-detail'; task: TaskItem }
  | { type: 'event-detail'; event: LocalEvent }
  | { type: 'subscription-event'; event: CalendarEventOccurrence }
  | { type: 'subscription-task'; task: SubscribedTaskOccurrence };

export const createTaskDetailsState = (
  task: TaskItem,
  tasks: TaskItem[],
  calendarTasks: TaskItem[]
): TasksDetailsPanelState => {
  return {
    type: 'task-detail',
    task: findBaseTask(task, tasks, calendarTasks) ?? task
  };
};

export const createTaskEditHandler = (
  task: TaskItem,
  tasks: TaskItem[],
  calendarTasks: TaskItem[],
  setDraft: (draft: TaskDraft) => void,
  setDetailsPanel: (state: TasksDetailsPanelState) => void
): (() => void) | undefined => {
  return () => {
    setDraft(draftFromTask(findBaseTask(task, tasks, calendarTasks) ?? task));
    setDetailsPanel({ type: 'task' });
  };
};

export const findBaseTask = (
  task: TaskItem,
  tasks: TaskItem[],
  calendarTasks: TaskItem[]
): TaskItem | undefined => {
  const baseId = task.id.split(':')[0];
  return (
    tasks.find((item) => item.id === baseId) ??
    calendarTasks.find((item) => item.id === baseId) ??
    tasks.find((item) => item.id === task.id) ??
    calendarTasks.find((item) => item.id === task.id)
  );
};

export const eventDraftFromTaskDraft = (
  draft: TaskDraft,
  fallbackDate: string
): LocalEventDraft => ({
  ...emptyLocalEventDraft(draft.deadlineDate || fallbackDate),
  title: draft.title,
  startTime: draft.deadlineTime || '09:00'
});

export const taskDraftFromEventDraft = (draft: LocalEventDraft): TaskDraft => ({
  ...emptyTaskDraft(),
  title: draft.title,
  deadlineDate: draft.date,
  deadlineTime: draft.allDay ? '' : draft.startTime
});

export const openEventDetails = (
  event: LocalEvent | CalendarEventOccurrence,
  setDetailsPanel: (state: TasksDetailsPanelState) => void
): void => {
  if ('sourceId' in event) {
    setDetailsPanel({ type: 'subscription-event', event });
    return;
  }
  setDetailsPanel({ type: 'event-detail', event });
};

export const getDetailsPanelTitle = (state: TasksDetailsPanelState): string => {
  if (state.type === 'task' || state.type === 'task-detail') return 'Task Details';
  if (state.type === 'event' || state.type === 'event-detail') return 'Event Details';
  if (state.type === 'subscription-task') return 'Subscribed Task';
  return 'Subscribed Event';
};
