import { useTasksSelector } from '../state/storeHooks';

export const useTasksAppState = () => {
  const tasks = useTasksSelector((state) => state.tasks.tasks);
  const calendarSources = useTasksSelector((state) => state.tasks.calendarSources);
  const calendarOccurrences = useTasksSelector((state) => state.tasks.calendarOccurrences);
  const subscribedTaskOccurrences = useTasksSelector(
    (state) => state.tasks.subscribedTaskOccurrences
  );
  const localEvents = useTasksSelector((state) => state.tasks.localEvents);
  const categories = useTasksSelector((state) => state.tasks.categories);
  const categoryFilter = useTasksSelector((state) => state.tasks.categoryFilter);
  const currentDate = useTasksSelector((state) => state.tasks.currentDate);
  const error = useTasksSelector((state) => state.tasks.error);
  const isRestored = useTasksSelector((state) => state.tasks.isRestored);
  const settings = useTasksSelector((state) => state.tasks.settings);
  const view = useTasksSelector((state) => state.tasks.view);

  return {
    calendarOccurrences,
    calendarSources,
    categories,
    categoryFilter,
    currentDate,
    error,
    isRestored,
    localEvents,
    settings,
    subscribedTaskOccurrences,
    tasks,
    view
  };
};
