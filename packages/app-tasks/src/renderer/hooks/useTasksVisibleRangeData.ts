import { useEffect, useMemo, useState } from 'react';
import type { TasksDefaultView, TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { getVisibleCalendarRange } from '@tnet/app-tasks/shared/calendarView';
import { addLocalDays } from '@tnet/app-tasks/shared/dateHelpers';
import type { SubscribedTaskOccurrence, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import {
  setTasks,
  setTasksCalendarOccurrences,
  setTasksError,
  setTasksLocalEvents,
  setTasksSubscribedTaskOccurrences
} from '../state/tasksSlice';
import { tasksTnetApi } from '../api/tasksTnetApi';
import { useTasksDispatch } from '../state/storeHooks';

export const useTasksVisibleRangeData = ({
  agendaDate,
  categoryFilter,
  currentDate,
  isRestored,
  settings,
  view
}: {
  agendaDate: string;
  categoryFilter?: string;
  currentDate: string;
  isRestored: boolean;
  settings: TasksGlobalSettings;
  view: TasksDefaultView;
}): {
  agendaSubscribedTaskOccurrences: SubscribedTaskOccurrence[];
  calendarTasks: TaskItem[];
  setCalendarTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  visibleRange: ReturnType<typeof getVisibleCalendarRange>;
} => {
  const dispatch = useTasksDispatch();
  const [agendaSubscribedTaskOccurrences, setAgendaSubscribedTaskOccurrences] = useState<
    SubscribedTaskOccurrence[]
  >([]);
  const [calendarTasks, setCalendarTasks] = useState<TaskItem[]>([]);
  const visibleRange = useMemo(
    () => getVisibleCalendarRange(currentDate, view, settings.weekStartsOn),
    [currentDate, settings.weekStartsOn, view]
  );

  useEffect(() => {
    if (!isRestored) return;
    let canceled = false;

    const loadVisibleRange = async (): Promise<void> => {
      const [openTasks, rangeTasks, occurrences, subscribedTasks, localEvents] = await Promise.all([
        tasksTnetApi.tasks.tasks.list({
          category: categoryFilter,
          includeCompleted: true
        }),
        tasksTnetApi.tasks.tasks.list({
          category: categoryFilter,
          startDate: visibleRange.startDate,
          endDate: visibleRange.endDate,
          includeCompleted: false
        }),
        tasksTnetApi.tasks.calendarOccurrences.list({
          startDate: visibleRange.startDate,
          endDate: visibleRange.endDate
        }),
        tasksTnetApi.tasks.subscribedTaskOccurrences.list({
          startDate: visibleRange.startDate,
          endDate: visibleRange.endDate
        }),
        tasksTnetApi.tasks.localEvents.list({
          startDate: visibleRange.startDate,
          endDate: visibleRange.endDate
        })
      ]);
      if (canceled) return;
      dispatch(setTasks(openTasks));
      setCalendarTasks(
        mergeTaskLists(
          rangeTasks,
          openTasks.filter((task) => task.recurrenceRule)
        )
      );
      dispatch(setTasksCalendarOccurrences(occurrences));
      dispatch(setTasksSubscribedTaskOccurrences(subscribedTasks));
      dispatch(setTasksLocalEvents(localEvents));
    };

    loadVisibleRange().catch((error: unknown) => {
      console.error('Failed to load tasks calendar range', error);
      if (!canceled) dispatch(setTasksError('Failed to load calendar range.'));
    });

    return () => {
      canceled = true;
    };
  }, [categoryFilter, dispatch, isRestored, visibleRange.endDate, visibleRange.startDate]);

  useEffect(() => {
    if (!isRestored) return;
    let canceled = false;

    const loadAgendaSubscriptions = async (): Promise<void> => {
      const subscribedTasks = await tasksTnetApi.tasks.subscribedTaskOccurrences.list({
        startDate: agendaDate,
        endDate: addLocalDays(agendaDate, 365)
      });
      if (!canceled) setAgendaSubscribedTaskOccurrences(subscribedTasks);
    };

    loadAgendaSubscriptions().catch((error: unknown) => {
      console.error('Failed to load tasks agenda subscriptions', error);
      if (!canceled) dispatch(setTasksError('Failed to load subscribed task deadlines.'));
    });

    return () => {
      canceled = true;
    };
  }, [agendaDate, dispatch, isRestored]);

  return { agendaSubscribedTaskOccurrences, calendarTasks, setCalendarTasks, visibleRange };
};

const mergeTaskLists = (primary: TaskItem[], secondary: TaskItem[]): TaskItem[] => {
  const existingIds = new Set(primary.map((task) => task.id));
  return [...primary, ...secondary.filter((task) => !existingIds.has(task.id))];
};
