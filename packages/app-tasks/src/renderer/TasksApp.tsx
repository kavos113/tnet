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
  buildVisibleCalendarItems,
  getVisibleCalendarRange
} from '@tnet/app-tasks/shared/calendarView';
import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { LocalEventEditor } from './LocalEventEditor';
import { TasksAgenda } from './TasksAgenda';
import { TasksCalendar } from './TasksCalendar';
import { TasksDetailsPanel } from './TasksDetailsPanel';
import { TasksPortal, type TasksPortalShortcut } from './TasksPortal';
import { TasksQuickAddForm, type QuickAddKind } from './TasksQuickAddForm';
import { TaskDetailsForm } from './TaskDetailsForm';
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
  const [clock, setClock] = useState(() => new Date());
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [quickAddKind, setQuickAddKind] = useState<QuickAddKind>('task');
  const [quickEventDraft, setQuickEventDraft] = useState<LocalEventDraft>(() =>
    emptyLocalEventDraft(currentDate)
  );
  const [detailsPanel, setDetailsPanel] = useState<TasksDetailsPanelState>();
  const [selectedQuickDate, setSelectedQuickDate] = useState<string>(currentDate);
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

  const setQuickInputDate = (date: string): void => {
    setSelectedQuickDate(date);
    setDraft((current) => ({ ...current, deadlineDate: date }));
    setQuickEventDraft((current) => ({ ...current, date }));
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
        eventDraft={quickEventDraft}
        draft={draft}
        isCategoryCompletionEnabled={settings.categoryCompletionEnabled}
        kind={quickAddKind}
        onCancelEdit={() => setDraft(emptyTaskDraft())}
        onDraftChange={setDraft}
        onEventDraftChange={setQuickEventDraft}
        onKindChange={setQuickAddKind}
        onOpenDetails={() => {
          if (quickAddKind === 'task') {
            setDetailsPanel({ type: 'task' });
            return;
          }
          setEventDraft(quickEventDraft);
          setDetailsPanel({ type: 'event' });
        }}
        onSubmit={() => runAction(saveQuickAdd)}
      />
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
          onEdit={(task) => {
            setDraft(draftFromTask(task));
            setDetailsPanel({ type: 'task' });
          }}
          onEventOpen={(event) => openEventDetails(event, setDetailsPanel)}
          onReadOnlyTaskOpen={(task) => setDetailsPanel({ type: 'subscription-task', task })}
          onTaskOpen={(task) => setDetailsPanel({ type: 'task-detail', task })}
        />
        <TasksCalendar
          currentDate={currentDate}
          endDate={visibleRange.endDate}
          items={calendarItems}
          showCurrentTime={view !== 'month'}
          startDate={visibleRange.startDate}
          onDateSelect={setQuickInputDate}
          onLocalEventSelect={(event) => {
            setDetailsPanel({ type: 'event-detail', event });
          }}
          onSubscribedEventSelect={(event) =>
            setDetailsPanel({ type: 'subscription-event', event })
          }
          onTaskSelect={(task) =>
            setDetailsPanel(createTaskDetailsState(task, tasks, calendarTasks))
          }
          onMoveRange={(days) => dispatch(setTasksCurrentDate(addLocalDays(currentDate, days)))}
          onRescheduleTask={(taskId, date) => runAction(() => rescheduleTask(taskId, date))}
          onToday={() => dispatch(setTasksCurrentDate(toLocalDateString()))}
        />
      </div>
      {detailsPanel ? (
        <TasksDetailsPanel
          title={getDetailsPanelTitle(detailsPanel)}
          readOnlyItem={
            detailsPanel.type === 'task-detail'
              ? {
                  type: 'task',
                  task: detailsPanel.task,
                  onEdit: createTaskEditHandler(
                    detailsPanel.task,
                    tasks,
                    calendarTasks,
                    setDraft,
                    setDetailsPanel
                  )
                }
              : detailsPanel.type === 'event-detail'
                ? {
                    type: 'event',
                    event: detailsPanel.event,
                    onEdit: () => {
                      setEventDraft(localEventDraftFromEvent(detailsPanel.event));
                      setDetailsPanel({ type: 'event' });
                    }
                  }
                : detailsPanel.type === 'subscription-event' ||
                    detailsPanel.type === 'subscription-task'
                  ? detailsPanel
                  : undefined
          }
          onClose={() => {
            setDetailsPanel(undefined);
            if (detailsPanel.type === 'event') setEventDraft(undefined);
          }}
        >
          {detailsPanel.type === 'task' ? (
            <>
              <DetailsKindSelect
                value="task"
                onChange={(kind) => {
                  if (kind === 'event') {
                    setEventDraft(eventDraftFromTaskDraft(draft, selectedQuickDate));
                    setDetailsPanel({ type: 'event' });
                  }
                }}
              />
              <TaskDetailsForm
                categories={categories}
                draft={draft}
                isCategoryCompletionEnabled={settings.categoryCompletionEnabled}
                onCancel={() => {
                  setDraft(emptyTaskDraft());
                  setDetailsPanel(undefined);
                }}
                onChange={setDraft}
                onDelete={
                  draft.id ? () => runAction(() => deleteTask(draft.id as string)) : undefined
                }
                onSave={() => runAction(saveDraft)}
              />
            </>
          ) : null}
          {detailsPanel.type === 'event' && eventDraft ? (
            <>
              <DetailsKindSelect
                value="event"
                onChange={(kind) => {
                  if (kind === 'task') {
                    setDraft(taskDraftFromEventDraft(eventDraft));
                    setDetailsPanel({ type: 'task' });
                  }
                }}
              />
              <LocalEventEditor
                draft={eventDraft}
                onCancel={() => {
                  setEventDraft(undefined);
                  setDetailsPanel(undefined);
                }}
                onChange={setEventDraft}
                onDelete={createEventDeleteHandler(eventDraft.id, (eventId) =>
                  runAction(() => deleteLocalEvent(eventId))
                )}
                onSave={() => runAction(saveEventDraft)}
              />
            </>
          ) : null}
        </TasksDetailsPanel>
      ) : null}
    </main>
  );
};

type TasksDetailsPanelState =
  | { type: 'task' }
  | { type: 'event' }
  | { type: 'task-detail'; task: TaskItem }
  | { type: 'event-detail'; event: LocalEvent }
  | { type: 'subscription-event'; event: CalendarEventOccurrence }
  | { type: 'subscription-task'; task: SubscribedTaskOccurrence };

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

const DetailsKindSelect = ({
  value,
  onChange
}: {
  value: QuickAddKind;
  onChange: (kind: QuickAddKind) => void;
}): React.JSX.Element => (
  <label className={styles.detailsKind}>
    Type
    <select
      aria-label="Detail item type"
      value={value}
      onChange={(event) => onChange(event.target.value as QuickAddKind)}
    >
      <option value="task">Task</option>
      <option value="event">Event</option>
    </select>
  </label>
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

const createTaskDetailsState = (
  task: TaskItem,
  tasks: TaskItem[],
  calendarTasks: TaskItem[]
): TasksDetailsPanelState => {
  if (task.id.startsWith('subscribed:')) {
    return { type: 'task-detail', task };
  }
  return {
    type: 'task-detail',
    task: findBaseTask(task, tasks, calendarTasks) ?? task
  };
};

const createTaskEditHandler = (
  task: TaskItem,
  tasks: TaskItem[],
  calendarTasks: TaskItem[],
  setDraft: (draft: TaskDraft) => void,
  setDetailsPanel: (state: TasksDetailsPanelState) => void
): (() => void) | undefined => {
  if (task.id.startsWith('subscribed:')) return undefined;
  return () => {
    setDraft(draftFromTask(findBaseTask(task, tasks, calendarTasks) ?? task));
    setDetailsPanel({ type: 'task' });
  };
};

const findBaseTask = (
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

const eventDraftFromTaskDraft = (draft: TaskDraft, fallbackDate: string): LocalEventDraft => ({
  ...emptyLocalEventDraft(draft.deadlineDate || fallbackDate),
  title: draft.title,
  startTime: draft.deadlineTime || '09:00'
});

const taskDraftFromEventDraft = (draft: LocalEventDraft): TaskDraft => ({
  ...emptyTaskDraft(),
  title: draft.title,
  deadlineDate: draft.date,
  deadlineTime: draft.allDay ? '' : draft.startTime
});

const openEventDetails = (
  event: LocalEvent | CalendarEventOccurrence,
  setDetailsPanel: (state: TasksDetailsPanelState) => void
): void => {
  if ('sourceId' in event) {
    setDetailsPanel({ type: 'subscription-event', event });
    return;
  }
  setDetailsPanel({ type: 'event-detail', event });
};

const getDetailsPanelTitle = (state: TasksDetailsPanelState): string => {
  if (state.type === 'task' || state.type === 'task-detail') return 'Task Details';
  if (state.type === 'event' || state.type === 'event-detail') return 'Event Details';
  if (state.type === 'subscription-task') return 'Subscribed Task';
  return 'Subscribed Event';
};

const mergeTaskLists = (primary: TaskItem[], secondary: TaskItem[]): TaskItem[] => {
  const existingIds = new Set(primary.map((task) => task.id));
  return [...primary, ...secondary.filter((task) => !existingIds.has(task.id))];
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
