import { useEffect } from 'react';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { tnetApi } from '@tnet/renderer-core/tnetApi';
import { getTasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { restoreTasks, setTasksCalendarSources, setTasksError } from './tasksSlice';
import { tasksTnetApi } from './tasksTnetApi';
import { useTasksDispatch } from './storeHooks';

export const TasksRuntime = (): null => {
  const dispatch = useTasksDispatch();

  useEffect(() => {
    let canceled = false;
    let intervalId: number | undefined;

    const restore = async (): Promise<void> => {
      const [shellConfig, tasks, categories, calendarSources] = await Promise.all([
        tnetApi.config.loadGlobal(),
        tasksTnetApi.tasks.tasks.list(),
        tasksTnetApi.tasks.categories.list(),
        tasksTnetApi.tasks.calendarSources.list()
      ]);
      const settings = getTasksGlobalSettings(normalizeGlobalConfig(shellConfig));

      if (canceled) return;
      dispatch(
        restoreTasks({
          tasks,
          categories,
          calendarSources,
          settings
        })
      );
      intervalId = window.setInterval(
        () => {
          tasksTnetApi.tasks.sync
            .manual()
            .then((result) => dispatch(setTasksCalendarSources(result.sources)))
            .catch((error: unknown) => {
              console.error('Periodic calendar sync failed', error);
            });
        },
        settings.syncIntervalMinutes * 60 * 1000
      );
    };

    restore().catch((error: unknown) => {
      console.error('Failed to restore tasks', error);
      if (!canceled) {
        dispatch(setTasksError(error instanceof Error ? error.message : String(error)));
        dispatch(
          restoreTasks({
            settings: getTasksGlobalSettings(normalizeGlobalConfig({}))
          })
        );
      }
    });

    return () => {
      canceled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [dispatch]);

  return null;
};
