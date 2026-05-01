import { useEffect } from 'react';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { tnetApi } from '@tnet/renderer-core/tnetApi';
import { getTasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import { restoreTasks, setTasksError } from './tasksSlice';
import { tasksTnetApi } from './tasksTnetApi';
import { useTasksDispatch } from './storeHooks';

export const TasksRuntime = (): null => {
  const dispatch = useTasksDispatch();

  useEffect(() => {
    let canceled = false;

    const restore = async (): Promise<void> => {
      const [shellConfig, tasks, categories, calendarSources] = await Promise.all([
        tnetApi.config.loadGlobal(),
        tasksTnetApi.tasks.tasks.list(),
        tasksTnetApi.tasks.categories.list(),
        tasksTnetApi.tasks.calendarSources.list()
      ]);

      if (canceled) return;
      dispatch(
        restoreTasks({
          tasks,
          categories,
          calendarSources,
          settings: getTasksGlobalSettings(normalizeGlobalConfig(shellConfig))
        })
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
    };
  }, [dispatch]);

  return null;
};
