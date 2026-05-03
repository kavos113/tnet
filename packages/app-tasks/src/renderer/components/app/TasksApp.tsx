import type { AppId } from '@tnet/shared/app/appTypes';
import { toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';
import { TasksAppHeader } from './TasksAppHeader';
import { TasksEditableDetailsPane } from '../details/TasksEditableDetailsPane';
import { TasksQuickAddForm } from '../forms/TasksQuickAddForm';
import type { TasksPortalShortcut } from '../navigation/TasksPortal';
import { TasksWorkspace } from './TasksWorkspace';
import { draftFromTask, emptyTaskDraft } from '../../state/tasksDraft';
import { useTasksDispatch } from '../../state/storeHooks';
import { setTasksView } from '../../state/tasksSlice';
import { useTaskReminderNotifications } from '../../hooks/useTaskReminderNotifications';
import { useTasksActions } from '../../hooks/useTasksActions';
import { useTasksAgendaData } from '../../hooks/useTasksAgendaData';
import { useTasksAppState } from '../../hooks/useTasksAppState';
import { useTasksUiState } from '../../hooks/useTasksUiState';
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
  const {
    calendarFocusDate,
    clock,
    detailsPanel,
    draft,
    eventDraft,
    moveCalendarRange,
    quickAddKind,
    quickEventDraft,
    selectedQuickDate,
    setCalendarFocusDate,
    setDetailsPanel,
    setDraft,
    setEventDraft,
    setQuickAddKind,
    setQuickEventDraft,
    setQuickInputDate
  } = useTasksUiState(currentDate, view);
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
        portalShortcuts={portalShortcuts}
        settings={settings}
        view={view}
        onSelectPortalApp={onSelectPortalApp}
        onViewChange={(view) => dispatch(setTasksView(view))}
      />
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
