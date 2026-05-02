import { useEffect, useState } from 'react';
import type { AppId } from '@tnet/shared/app/appTypes';
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
  const { calendarTasks, setCalendarTasks, visibleRange } = useTasksVisibleRangeData({
    categoryFilter,
    currentDate,
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
    todayEvents,
    todaySubscribedTasks,
    todayTasks,
    undatedTasks,
    upcomingDeadlines,
    visibleCompletedTasks
  } = useTasksAgendaData({
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
  });
  const {
    completeTask,
    deleteLocalEvent,
    deleteTask,
    rescheduleTask,
    runAction,
    saveDraft,
    saveEventDraft,
    saveQuickAdd
  } = useTasksActions({
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
  });

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
        completedTasks={visibleCompletedTasks}
        currentDate={currentDate}
        todayEvents={todayEvents}
        todaySubscribedTasks={todaySubscribedTasks}
        todayTasks={todayTasks}
        tasks={tasks}
        undatedTasks={undatedTasks}
        upcomingDeadlines={upcomingDeadlines}
        view={view}
        visibleRange={visibleRange}
        dispatch={dispatch}
        onCompleteTask={(taskId, completed) => runAction(() => completeTask(taskId, completed))}
        onDeleteTask={(taskId) => runAction(() => deleteTask(taskId))}
        onEditTask={(task) => {
          setDraft(draftFromTask(task));
          setDetailsPanel({ type: 'task' });
        }}
        onRescheduleTask={(taskId, date) => runAction(() => rescheduleTask(taskId, date))}
        onSelectQuickDate={setQuickInputDate}
        onSetDetailsPanel={setDetailsPanel}
      />
      {detailsPanel ? (
        <TasksEditableDetailsPane
          calendarTasks={calendarTasks}
          categories={categories}
          detailsPanel={detailsPanel}
          draft={draft}
          eventDraft={eventDraft}
          isCategoryCompletionEnabled={settings.categoryCompletionEnabled}
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
