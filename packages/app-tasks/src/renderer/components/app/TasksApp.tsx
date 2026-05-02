import { useEffect, useState } from 'react';
import type { AppId } from '@tnet/shared/app/appTypes';
import { addLocalDays, toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';
import { TasksAppHeader } from './TasksAppHeader';
import { TasksEditableDetailsPane } from '../details/TasksEditableDetailsPane';
import { TasksQuickAddForm, type QuickAddKind } from '../forms/TasksQuickAddForm';
import { TasksPortal, type TasksPortalShortcut } from '../navigation/TasksPortal';
import { TasksWorkspace } from './TasksWorkspace';
import { emptyLocalEventDraft, type LocalEventDraft } from '../../state/localEventDraft';
import { draftFromTask, emptyTaskDraft, type TaskDraft } from '../../state/tasksDraft';
import { type TasksDetailsPanelState } from '../../state/tasksDetailsState';
import { useTasksDispatch } from '../../state/storeHooks';
import { setTasksView } from '../../state/tasksSlice';
import { useTaskReminderNotifications } from '../../hooks/useTaskReminderNotifications';
import { useTasksActions } from '../../hooks/useTasksActions';
import { useTasksAgendaData } from '../../hooks/useTasksAgendaData';
import { useTasksAppState } from '../../hooks/useTasksAppState';
import { useTasksVisibleRangeData } from '../../hooks/useTasksVisibleRangeData';
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
  const {
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
  } = useTasksAppState();
  const [clock, setClock] = useState(() => new Date());
  const [draft, setDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [quickAddKind, setQuickAddKind] = useState<QuickAddKind>('task');
  const [quickEventDraft, setQuickEventDraft] = useState<LocalEventDraft>(() =>
    emptyLocalEventDraft(currentDate)
  );
  const [detailsPanel, setDetailsPanel] = useState<TasksDetailsPanelState>();
  const [selectedQuickDate, setSelectedQuickDate] = useState<string>(currentDate);
  const [eventDraft, setEventDraft] = useState<LocalEventDraft>();
  const [calendarFocusDate, setCalendarFocusDate] = useState<string>(currentDate);
  const {
    agendaSubscribedTaskOccurrences,
    calendarTasks,
    setAgendaSubscribedTaskOccurrences,
    setCalendarTasks,
    visibleRange
  } = useTasksVisibleRangeData({
    agendaDate: currentDate,
    categoryFilter,
    currentDate: calendarFocusDate,
    isRestored,
    settings,
    view
  });

  useTaskReminderNotifications(tasks);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const {
    calendarItems,
    sourceColors,
    sourceNames,
    todayEvents,
    todaySubscribedTasks,
    todayTasks,
    undatedTasks,
    upcomingDeadlines,
    visibleCompletedSubscribedTasks,
    visibleCompletedTasks
  } = useTasksAgendaData({
    calendarOccurrences,
    calendarSources,
    calendarTasks,
    categoryFilter,
    calendarFocusDate,
    agendaSubscribedTaskOccurrences,
    currentDate,
    localEvents,
    settings,
    subscribedTaskOccurrences,
    tasks,
    visibleRange
  });
  const {
    completeSubscribedTask,
    completeTask,
    deleteLocalEvent,
    deleteTask,
    rescheduleTask,
    runAction,
    saveDraft,
    saveEventDraft,
    saveQuickAdd
  } = useTasksActions({
    agendaDate: currentDate,
    calendarTasks,
    draft,
    eventDraft,
    quickAddKind,
    quickEventDraft,
    selectedQuickDate,
    tasks,
    visibleRange,
    setAgendaSubscribedTaskOccurrences,
    setCalendarTasks,
    setDetailsPanel,
    setDraft,
    setEventDraft,
    setQuickEventDraft
  });

  const setQuickInputDate = (date: string): void => {
    setSelectedQuickDate(date);
    setDraft((current) => ({ ...current, deadlineDate: date }));
    setQuickEventDraft((current) => ({ ...current, date }));
  };

  const moveCalendarRange = (days: number): void => {
    setCalendarFocusDate((date) =>
      view === 'month' ? addLocalMonths(date, days > 0 ? 1 : -1) : addLocalDays(date, days)
    );
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
      <TasksAppHeader
        clock={clock}
        currentDate={currentDate}
        settings={settings}
        view={view}
        onViewChange={(view) => dispatch(setTasksView(view))}
      />
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
      <TasksWorkspace
        calendarItems={calendarItems}
        calendarTasks={calendarTasks}
        categoryColors={settings.categoryColors}
        completedTasks={visibleCompletedTasks}
        completedSubscribedTasks={visibleCompletedSubscribedTasks}
        currentDate={currentDate}
        focusDate={calendarFocusDate}
        todayEvents={todayEvents}
        todaySubscribedTasks={todaySubscribedTasks}
        todayTasks={todayTasks}
        tasks={tasks}
        undatedTasks={undatedTasks}
        upcomingDeadlines={upcomingDeadlines}
        sourceColors={sourceColors}
        view={view}
        visibleRange={visibleRange}
        onCompleteTask={(taskId, completed) => runAction(() => completeTask(taskId, completed))}
        onCompleteSubscribedTask={(occurrenceId, completed) =>
          runAction(() => completeSubscribedTask(occurrenceId, completed))
        }
        onDeleteTask={(taskId) => runAction(() => deleteTask(taskId))}
        onEditTask={(task) => {
          setDraft(draftFromTask(task));
          setDetailsPanel({ type: 'task' });
        }}
        onMoveRange={moveCalendarRange}
        onRescheduleTask={(taskId, date) => runAction(() => rescheduleTask(taskId, date))}
        onSelectQuickDate={setQuickInputDate}
        onSetDetailsPanel={setDetailsPanel}
        onToday={() => setCalendarFocusDate(toLocalDateString())}
      />
      {detailsPanel ? (
        <TasksEditableDetailsPane
          calendarTasks={calendarTasks}
          categories={categories}
          detailsPanel={detailsPanel}
          draft={draft}
          eventDraft={eventDraft}
          isCategoryCompletionEnabled={settings.categoryCompletionEnabled}
          categoryColors={settings.categoryColors}
          sourceColors={sourceColors}
          sourceNames={sourceNames}
          selectedQuickDate={selectedQuickDate}
          tasks={tasks}
          onClose={() => {
            setDetailsPanel(undefined);
            if (detailsPanel.type === 'event') setEventDraft(undefined);
          }}
          onDeleteEvent={(eventId) => runAction(() => deleteLocalEvent(eventId))}
          onDeleteTask={(taskId) => runAction(() => deleteTask(taskId))}
          onDraftChange={setDraft}
          onEventDraftChange={setEventDraft}
          onPanelChange={setDetailsPanel}
          onSaveEvent={() => runAction(saveEventDraft)}
          onSaveTask={() => runAction(saveDraft)}
        />
      ) : null}
    </main>
  );
};

const addLocalMonths = (date: string, months: number): string => {
  const parsed = new Date(`${date.slice(0, 7)}-01T00:00:00`);
  parsed.setMonth(parsed.getMonth() + months);
  return toLocalDateString(parsed);
};
