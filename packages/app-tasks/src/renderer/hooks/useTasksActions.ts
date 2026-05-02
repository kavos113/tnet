import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import {
  emptyLocalEventDraft,
  localEventInputFromDraft,
  type LocalEventDraft
} from '../state/localEventDraft';
import {
  emptyTaskDraft,
  saveInputFromDraft,
  saveInputFromTask,
  type TaskDraft
} from '../state/tasksDraft';
import { upsertTaskInList } from '../state/tasksListUtils';
import {
  removeTask,
  setTaskCategories,
  setTasksError,
  setTasksLocalEvents,
  upsertTask
} from '../state/tasksSlice';
import { tasksTnetApi } from '../api/tasksTnetApi';
import { useTasksDispatch } from '../state/storeHooks';
import type { QuickAddKind } from '../components/forms/TasksQuickAddForm';
import type { TasksDetailsPanelState } from '../state/tasksDetailsState';
import type { CalendarDateRange } from '@tnet/app-tasks/shared/calendarView';

export const useTasksActions = ({
  calendarTasks,
  draft,
  eventDraft,
  quickAddKind,
  quickEventDraft,
  selectedQuickDate,
  tasks,
  visibleRange,
  setCalendarTasks,
  setDetailsPanel,
  setDraft,
  setEventDraft,
  setQuickEventDraft
}: {
  calendarTasks: TaskItem[];
  draft: TaskDraft;
  eventDraft?: LocalEventDraft;
  quickAddKind: QuickAddKind;
  quickEventDraft: LocalEventDraft;
  selectedQuickDate: string;
  tasks: TaskItem[];
  visibleRange: CalendarDateRange;
  setCalendarTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  setDetailsPanel: (state: TasksDetailsPanelState | undefined) => void;
  setDraft: (draft: TaskDraft) => void;
  setEventDraft: (draft: LocalEventDraft | undefined) => void;
  setQuickEventDraft: (draft: LocalEventDraft) => void;
}) => {
  const dispatch = useTasksDispatch();

  const reloadCategories = async (): Promise<void> => {
    dispatch(setTaskCategories(await tasksTnetApi.tasks.categories.list()));
  };

  const saveDraft = async (): Promise<void> => {
    const input = saveInputFromDraft(draft);
    if (!input.title) return;
    const task = await tasksTnetApi.tasks.tasks.save(input);
    dispatch(upsertTask(task));
    setCalendarTasks((current) => upsertTaskInList(current, task));
    setDraft(emptyTaskDraft());
    setDetailsPanel(undefined);
    await reloadCategories();
  };

  const saveQuickAdd = async (): Promise<void> => {
    if (quickAddKind === 'task') {
      await saveDraft();
      return;
    }
    if (!quickEventDraft.title.trim()) return;
    await saveLocalEventDraft(quickEventDraft);
    setQuickEventDraft(emptyLocalEventDraft(selectedQuickDate));
  };

  const completeTask = async (taskId: string, completed: boolean): Promise<void> => {
    const task = await tasksTnetApi.tasks.tasks.complete({ taskId, completed });
    dispatch(upsertTask(task));
    setCalendarTasks((current) => upsertTaskInList(current, task));
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await tasksTnetApi.tasks.tasks.remove({ taskId });
    dispatch(removeTask(taskId));
    setCalendarTasks((current) => current.filter((task) => task.id !== taskId));
    setDetailsPanel(undefined);
    await reloadCategories();
  };

  const rescheduleTask = async (taskId: string, date: string): Promise<void> => {
    const task =
      tasks.find((task) => task.id === taskId) ?? calendarTasks.find((task) => task.id === taskId);
    if (!task) return;
    const saved = await tasksTnetApi.tasks.tasks.save({
      ...saveInputFromTask(task),
      deadlineDate: date
    });
    dispatch(upsertTask(saved));
    setCalendarTasks((current) => upsertTaskInList(current, saved));
  };

  const saveEventDraft = async (): Promise<void> => {
    if (!eventDraft?.title.trim()) return;
    await saveLocalEventDraft(eventDraft);
    setEventDraft(undefined);
    setDetailsPanel(undefined);
  };

  const saveLocalEventDraft = async (draft: LocalEventDraft): Promise<void> => {
    await tasksTnetApi.tasks.localEvents.save(localEventInputFromDraft(draft));
    const refreshed = await tasksTnetApi.tasks.localEvents.list({
      startDate: visibleRange.startDate,
      endDate: visibleRange.endDate
    });
    dispatch(setTasksLocalEvents(refreshed));
  };

  const deleteLocalEvent = async (eventId: string): Promise<void> => {
    await tasksTnetApi.tasks.localEvents.remove({ eventId });
    const refreshed = await tasksTnetApi.tasks.localEvents.list({
      startDate: visibleRange.startDate,
      endDate: visibleRange.endDate
    });
    dispatch(setTasksLocalEvents(refreshed));
    setEventDraft(undefined);
    setDetailsPanel(undefined);
  };

  const runAction = (action: () => Promise<void>): void => {
    action().catch((error: unknown) => {
      console.error('Tasks action failed', error);
      dispatch(setTasksError(error instanceof Error ? error.message : String(error)));
    });
  };

  return {
    completeTask,
    deleteLocalEvent,
    deleteTask,
    rescheduleTask,
    runAction,
    saveDraft,
    saveEventDraft,
    saveQuickAdd
  };
};
