import { addLocalDays, toLocalDateString } from '@tnet/app-tasks/shared/dateHelpers';
import type { CalendarDateRange, CalendarDayItems } from '@tnet/app-tasks/shared/calendarView';
import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import type { TasksDefaultView } from '@tnet/app-tasks/shared/config';
import { TasksAgenda } from '../agenda/TasksAgenda';
import { TasksCalendar } from '../calendar/TasksCalendar';
import {
  createTaskDetailsState,
  openEventDetails,
  type TasksDetailsPanelState
} from '../../state/tasksDetailsState';
import type { useTasksDispatch } from '../../state/storeHooks';
import { setTasksCurrentDate } from '../../state/tasksSlice';
import styles from './TasksApp.module.css';

export interface TasksWorkspaceProps {
  calendarItems: CalendarDayItems[];
  calendarTasks: TaskItem[];
  completedTasks: TaskItem[];
  currentDate: string;
  todayEvents: Array<LocalEvent | CalendarEventOccurrence>;
  todaySubscribedTasks: SubscribedTaskOccurrence[];
  todayTasks: TaskItem[];
  tasks: TaskItem[];
  undatedTasks: TaskItem[];
  upcomingDeadlines: Array<TaskItem | SubscribedTaskOccurrence>;
  view: TasksDefaultView;
  visibleRange: CalendarDateRange;
  dispatch: ReturnType<typeof useTasksDispatch>;
  onCompleteTask: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onRescheduleTask: (taskId: string, date: string) => void;
  onSelectQuickDate: (date: string) => void;
  onSetDetailsPanel: (state: TasksDetailsPanelState) => void;
}

export const TasksWorkspace = ({
  calendarItems,
  calendarTasks,
  completedTasks,
  currentDate,
  todayEvents,
  todaySubscribedTasks,
  todayTasks,
  tasks,
  undatedTasks,
  upcomingDeadlines,
  view,
  visibleRange,
  dispatch,
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onRescheduleTask,
  onSelectQuickDate,
  onSetDetailsPanel
}: TasksWorkspaceProps): React.JSX.Element => (
  <div className={styles.content}>
    <TasksAgenda
      completedTasks={completedTasks}
      todayEvents={todayEvents}
      todaySubscribedTasks={todaySubscribedTasks}
      todayTasks={todayTasks}
      undatedTasks={undatedTasks}
      upcomingDeadlines={upcomingDeadlines}
      onComplete={onCompleteTask}
      onDelete={onDeleteTask}
      onEdit={onEditTask}
      onEventOpen={(event) => openEventDetails(event, onSetDetailsPanel)}
      onReadOnlyTaskOpen={(task) => onSetDetailsPanel({ type: 'subscription-task', task })}
      onTaskOpen={(task) => onSetDetailsPanel({ type: 'task-detail', task })}
    />
    <TasksCalendar
      currentDate={currentDate}
      endDate={visibleRange.endDate}
      items={calendarItems}
      showCurrentTime={view !== 'month'}
      startDate={visibleRange.startDate}
      onDateSelect={onSelectQuickDate}
      onLocalEventSelect={(event) => onSetDetailsPanel({ type: 'event-detail', event })}
      onSubscribedEventSelect={(event) => onSetDetailsPanel({ type: 'subscription-event', event })}
      onTaskSelect={(task) => onSetDetailsPanel(createTaskDetailsState(task, tasks, calendarTasks))}
      onMoveRange={(days) => dispatch(setTasksCurrentDate(addLocalDays(currentDate, days)))}
      onRescheduleTask={onRescheduleTask}
      onToday={() => dispatch(setTasksCurrentDate(toLocalDateString()))}
    />
  </div>
);
