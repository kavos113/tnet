import { useEffect, useMemo, useState } from 'react';
import type { AppId } from '@tnet/shared/app/appTypes';
import type { TasksDefaultView } from '@tnet/app-tasks/shared/config';
import {
  compareTaskDeadlines,
  compareUndatedTasks,
  addLocalDays,
  toLocalDateString
} from '@tnet/app-tasks/shared/dateHelpers';
import {
  expandRecurringTasksForRange,
  getVisibleCalendarRange,
  groupVisibleCalendarItems
} from '@tnet/app-tasks/shared/calendarView';
import type { SubscribedTaskOccurrence, TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import { CalendarDateActions } from './CalendarDateActions';
import { LocalEventEditor } from './LocalEventEditor';
import { TasksAgenda } from './TasksAgenda';
import { TasksCalendar } from './TasksCalendar';
import { TasksPortal, type TasksPortalShortcut } from './TasksPortal';
import { TasksQuickAddForm } from './TasksQuickAddForm';
import {
  emptyLocalEventDraft,
  localEventDraftFromEvent,
  localEventInputFromDraft,
  type LocalEventDraft
} from './localEventDraft';
import {
  draftFromTask,
  emptyTaskDraft,
  saveInputFromDraft,
  saveInputFromTask,
  type TaskDraft
} from './tasksDraft';
import {
  removeTask,
  setTaskCategories,
  setTasks,
  setTasksCalendarOccurrences,
  setTasksLocalEvents,
  setTasksSubscribedTaskOccurrences,
  setTasksCurrentDate,
  setTasksError,
  setTasksView,
  upsertTask
} from './tasksSlice';
import { tasksTnetApi } from './tasksTnetApi';
import { useTasksDispatch, useTasksSelector } from './storeHooks';
import { useTaskReminderNotifications } from './useTaskReminderNotifications';
import styles from './TasksApp.module.css';

export interface TasksAppProps {
  portalShortcuts?: TasksPortalShortcut[];
  onSelectPortalApp?: (appId: AppId) => void;
  onOpenTasksSettings?: () => void;
}

export const TasksApp = ({
  portalShortcuts = [],
  onSelectPortalApp = () => undefined,
  onOpenTasksSettings = () => undefined
}: TasksAppProps): React.JSX.Element => {
  const dispatch = useTasksDispatch();
  const tasks = useTasksSelector((state) => state.tasks.tasks);
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
  const [clock, setClock] = useState(() => new Date());
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [dateActionDate, setDateActionDate] = useState<string>();
  const [eventDraft, setEventDraft] = useState<LocalEventDraft>();
  const [calendarTasks, setCalendarTasks] = useState<TaskItem[]>([]);
  const visibleRange = useMemo(
    () => getVisibleCalendarRange(currentDate, view, settings.weekStartsOn),
    [currentDate, settings.weekStartsOn, view]
  );

  useTaskReminderNotifications(tasks);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

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

  const visibleOpenTasks = useMemo(
    () =>
      tasks
        .filter((task) => !categoryFilter || task.category === categoryFilter)
        .filter((task) => !task.completedAt),
    [categoryFilter, tasks]
  );
  const visibleCompletedTasks = useMemo(
    () =>
      tasks
        .filter((task) => !categoryFilter || task.category === categoryFilter)
        .filter((task) => task.completedAt)
        .sort((left, right) => (right.completedAt ?? '').localeCompare(left.completedAt ?? '')),
    [categoryFilter, tasks]
  );
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
      groupVisibleCalendarItems({
        dates: visibleRange.dates,
        currentDate,
        tasks: expandRecurringTasksForRange(
          [...calendarTasks, ...subscribedTaskOccurrences.map(subscribedTaskToTaskItem)],
          visibleRange.startDate,
          visibleRange.endDate
        ).sort(compareTaskDeadlines),
        localEvents,
        events: calendarOccurrences
      }),
    [
      calendarOccurrences,
      calendarTasks,
      currentDate,
      localEvents,
      subscribedTaskOccurrences,
      visibleRange.dates,
      visibleRange.endDate,
      visibleRange.startDate
    ]
  );

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
    await reloadCategories();
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
    await tasksTnetApi.tasks.localEvents.save(localEventInputFromDraft(eventDraft));
    const refreshed = await tasksTnetApi.tasks.localEvents.list({
      startDate: visibleRange.startDate,
      endDate: visibleRange.endDate
    });
    dispatch(setTasksLocalEvents(refreshed));
    setEventDraft(undefined);
  };

  const deleteLocalEvent = async (eventId: string): Promise<void> => {
    await tasksTnetApi.tasks.localEvents.remove({ eventId });
    const refreshed = await tasksTnetApi.tasks.localEvents.list({
      startDate: visibleRange.startDate,
      endDate: visibleRange.endDate
    });
    dispatch(setTasksLocalEvents(refreshed));
    setEventDraft(undefined);
  };

  const runAction = (action: () => Promise<void>): void => {
    action().catch((error: unknown) => {
      console.error('Tasks action failed', error);
      dispatch(setTasksError(error instanceof Error ? error.message : String(error)));
    });
  };

  if (!isRestored) {
    return (
      <main className={styles.root} aria-label="Tasks">
        <div className={styles.loading}>Restoring tasks...</div>
      </main>
    );
  }

  return (
    <main className={styles.root} aria-label="Tasks">
      <header className={styles.clockHeader}>
        <div className={styles.clockGroup}>
          <time
            className={`${styles.clock} ${
              settings.clockSize === 'compact' ? styles.clockCompact : ''
            }`}
            dateTime={clock.toISOString()}
          >
            {formatClock(clock, settings.timeFormat)}
          </time>
          <span className={styles.dateLabel}>{formatDateLabel(currentDate)}</span>
        </div>
        <ViewControls view={view} onViewChange={(view) => dispatch(setTasksView(view))} />
      </header>
      {settings.showPortal ? (
        <TasksPortal shortcuts={portalShortcuts} onSelect={onSelectPortalApp} />
      ) : null}
      <div className={styles.subscriptionBar}>
        <button type="button" className={styles.secondaryButton} onClick={onOpenTasksSettings}>
          Add subscription
        </button>
      </div>
      <TasksQuickAddForm
        categories={categories}
        draft={draft}
        isCategoryCompletionEnabled={settings.categoryCompletionEnabled}
        onCancelEdit={() => setDraft(emptyTaskDraft())}
        onDraftChange={setDraft}
        onSubmit={() => runAction(saveDraft)}
      />
      {dateActionDate ? (
        <CalendarDateActions
          date={dateActionDate}
          onAddEvent={() => {
            setEventDraft(emptyLocalEventDraft(dateActionDate));
            setDateActionDate(undefined);
          }}
          onAddTask={() => {
            setDraft((current) => ({ ...current, deadlineDate: dateActionDate }));
            setDateActionDate(undefined);
          }}
        />
      ) : null}
      {eventDraft ? (
        <LocalEventEditor
          draft={eventDraft}
          onCancel={() => setEventDraft(undefined)}
          onChange={setEventDraft}
          onDelete={createEventDeleteHandler(eventDraft.id, (eventId) =>
            runAction(() => deleteLocalEvent(eventId))
          )}
          onSave={() => runAction(saveEventDraft)}
        />
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.content}>
        <TasksAgenda
          completedTasks={visibleCompletedTasks}
          todayEvents={todayEvents}
          todaySubscribedTasks={todaySubscribedTasks}
          todayTasks={todayTasks}
          undatedTasks={undatedTasks}
          upcomingDeadlines={upcomingDeadlines}
          onComplete={(taskId, completed) => runAction(() => completeTask(taskId, completed))}
          onDelete={(taskId) => runAction(() => deleteTask(taskId))}
          onEdit={(task) => setDraft(draftFromTask(task))}
        />
        <TasksCalendar
          currentDate={currentDate}
          endDate={visibleRange.endDate}
          items={calendarItems}
          showCurrentTime={view !== 'month'}
          startDate={visibleRange.startDate}
          onDateSelect={(date) => setDateActionDate(date)}
          onLocalEventSelect={(event) => setEventDraft(localEventDraftFromEvent(event))}
          onMoveRange={(days) => dispatch(setTasksCurrentDate(addLocalDays(currentDate, days)))}
          onRescheduleTask={(taskId, date) => runAction(() => rescheduleTask(taskId, date))}
          onToday={() => dispatch(setTasksCurrentDate(toLocalDateString()))}
        />
      </div>
    </main>
  );
};

const ViewControls = ({
  view,
  onViewChange
}: {
  view: TasksDefaultView;
  onViewChange: (view: TasksDefaultView) => void;
}): React.JSX.Element => (
  <div className={styles.viewControls} aria-label="Task view">
    {(['today', 'week', 'month'] as TasksDefaultView[]).map((viewId) => (
      <button
        type="button"
        key={viewId}
        className={`${styles.viewButton} ${view === viewId ? styles.viewButtonActive : ''}`}
        onClick={() => onViewChange(viewId)}
      >
        {viewLabels[viewId]}
      </button>
    ))}
  </div>
);

const upsertTaskInList = (tasks: TaskItem[], task: TaskItem): TaskItem[] => {
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index < 0) return [...tasks, task];
  return tasks.map((item) => (item.id === task.id ? task : item));
};

const createEventDeleteHandler = (
  eventId: string | undefined,
  onDelete: (eventId: string) => void
): (() => void) | undefined => (eventId ? () => onDelete(eventId) : undefined);

const mergeTaskLists = (primary: TaskItem[], secondary: TaskItem[]): TaskItem[] => {
  const existingIds = new Set(primary.map((task) => task.id));
  return [...primary, ...secondary.filter((task) => !existingIds.has(task.id))];
};

const subscribedTaskToTaskItem = (task: SubscribedTaskOccurrence): TaskItem => ({
  id: `subscribed:${task.id}`,
  title: task.title,
  notes: task.description ?? '',
  deadlineDate: task.deadlineDate,
  deadlineTime: task.deadlineTime,
  sourceUrl: task.sourceId,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

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

const viewLabels: Record<TasksDefaultView, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month'
};

const formatClock = (date: Date, timeFormat: '12h' | '24h'): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h'
  }).format(date);

const formatDateLabel = (date: string): string =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
