import { useMemo } from 'react';
import {
  buildVisibleCalendarItems,
  type CalendarDateRange
} from '@tnet/app-tasks/shared/calendarView';
import { compareTaskDeadlines, compareUndatedTasks } from '@tnet/app-tasks/shared/dateHelpers';
import type { TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import type {
  CalendarEventOccurrence,
  CalendarSource,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';

export const useTasksAgendaData = ({
  calendarOccurrences,
  calendarSources,
  calendarTasks,
  categoryFilter,
  currentDate,
  localEvents,
  settings,
  subscribedTaskOccurrences,
  tasks,
  visibleRange
}: {
  calendarOccurrences: CalendarEventOccurrence[];
  calendarSources: CalendarSource[];
  calendarTasks: TaskItem[];
  categoryFilter?: string;
  currentDate: string;
  localEvents: LocalEvent[];
  settings: TasksGlobalSettings;
  subscribedTaskOccurrences: SubscribedTaskOccurrence[];
  tasks: TaskItem[];
  visibleRange: CalendarDateRange;
}) => {
  const visibleOpenTasks = useMemo(
    () =>
      tasks
        .filter((task) => !categoryFilter || task.category === categoryFilter)
        .filter((task) => !task.completedAt),
    [categoryFilter, tasks]
  );
  const visibleCompletedTasks = useMemo(() => {
    const completedTasks = tasks
      .filter((task) => !categoryFilter || task.category === categoryFilter)
      .filter((task) => task.completedAt);
    const scopedTasks =
      settings.completedTaskScope === 'today'
        ? completedTasks.filter((task) => task.completedAt?.slice(0, 10) === currentDate)
        : completedTasks;

    return scopedTasks.sort((left, right) =>
      (right.completedAt ?? '').localeCompare(left.completedAt ?? '')
    );
  }, [categoryFilter, currentDate, settings.completedTaskScope, tasks]);
  const todayTasks = useMemo(
    () =>
      visibleOpenTasks
        .filter((task) => task.deadlineDate === currentDate)
        .sort(compareTaskDeadlines),
    [currentDate, visibleOpenTasks]
  );
  const todaySubscribedTasks = useMemo(
    () =>
      subscribedTaskOccurrences
        .filter((task) => task.deadlineDate === currentDate)
        .sort(compareSubscribedTaskDeadlines),
    [currentDate, subscribedTaskOccurrences]
  );
  const todayEvents = useMemo(
    () =>
      [...localEvents, ...calendarOccurrences]
        .filter(
          (event) =>
            event.startsAt.slice(0, 10) <= currentDate && event.endsAt.slice(0, 10) >= currentDate
        )
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    [calendarOccurrences, currentDate, localEvents]
  );
  const upcomingDeadlines = useMemo(
    () =>
      [...visibleOpenTasks, ...subscribedTaskOccurrences]
        .filter((item) => Boolean(item.deadlineDate))
        .filter((item) => (item.deadlineDate ?? '') >= currentDate)
        .sort(compareAgendaDeadlineItems)
        .slice(0, 8),
    [currentDate, subscribedTaskOccurrences, visibleOpenTasks]
  );
  const undatedTasks = useMemo(
    () => visibleOpenTasks.filter((task) => !task.deadlineDate).sort(compareUndatedTasks),
    [visibleOpenTasks]
  );
  const calendarItems = useMemo(
    () =>
      buildVisibleCalendarItems({
        dates: visibleRange.dates,
        currentDate,
        startDate: visibleRange.startDate,
        endDate: visibleRange.endDate,
        tasks: [...calendarTasks].sort(compareTaskDeadlines),
        subscribedTasks: subscribedTaskOccurrences,
        localEvents,
        events: calendarOccurrences,
        sources: calendarSources
      }),
    [
      calendarOccurrences,
      calendarSources,
      calendarTasks,
      currentDate,
      localEvents,
      subscribedTaskOccurrences,
      visibleRange.dates,
      visibleRange.endDate,
      visibleRange.startDate
    ]
  );

  return {
    calendarItems,
    todayEvents,
    todaySubscribedTasks,
    todayTasks,
    undatedTasks,
    upcomingDeadlines,
    visibleCompletedTasks
  };
};

const compareSubscribedTaskDeadlines = (
  left: SubscribedTaskOccurrence,
  right: SubscribedTaskOccurrence
): number =>
  `${left.deadlineDate}T${left.deadlineTime ?? '00:00'}`.localeCompare(
    `${right.deadlineDate}T${right.deadlineTime ?? '00:00'}`
  ) || left.title.localeCompare(right.title);

const compareAgendaDeadlineItems = (
  left: TaskItem | SubscribedTaskOccurrence,
  right: TaskItem | SubscribedTaskOccurrence
): number =>
  `${left.deadlineDate ?? ''}T${left.deadlineTime ?? '00:00'}`.localeCompare(
    `${right.deadlineDate ?? ''}T${right.deadlineTime ?? '00:00'}`
  ) || left.title.localeCompare(right.title);
