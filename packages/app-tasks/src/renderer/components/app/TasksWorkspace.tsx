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
import styles from './TasksApp.module.css';

export interface TasksWorkspaceProps {
  calendarItems: CalendarDayItems[];
  calendarTasks: TaskItem[];
  completedTasks: TaskItem[];
  currentDate: string;
  focusDate: string;
  todayEvents: Array<LocalEvent | CalendarEventOccurrence>;
  todaySubscribedTasks: SubscribedTaskOccurrence[];
  todayTasks: TaskItem[];
  tasks: TaskItem[];
  undatedTasks: TaskItem[];
  upcomingDeadlines: Array<TaskItem | SubscribedTaskOccurrence>;
  view: TasksDefaultView;
  visibleRange: CalendarDateRange;
  onCompleteTask: (taskId: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onMoveRange: (days: number) => void;
  onRescheduleTask: (taskId: string, date: string) => void;
  onSelectQuickDate: (date: string) => void;
  onSetDetailsPanel: (state: TasksDetailsPanelState) => void;
  onToday: () => void;
}

export const TasksWorkspace = ({
  calendarItems,
  calendarTasks,
  completedTasks,
  currentDate,
  focusDate,
  todayEvents,
  todaySubscribedTasks,
  todayTasks,
  tasks,
  undatedTasks,
  upcomingDeadlines,
  view,
  visibleRange,
  onCompleteTask,
  onDeleteTask,
  onEditTask,
  onMoveRange,
  onRescheduleTask,
  onSelectQuickDate,
  onSetDetailsPanel,
  onToday
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
      focusDate={focusDate}
      items={calendarItems}
      showCurrentTime={view !== 'month'}
      startDate={visibleRange.startDate}
      view={view}
      onDateSelect={onSelectQuickDate}
      onLocalEventSelect={(event) => onSetDetailsPanel({ type: 'event-detail', event })}
      onSubscribedEventSelect={(event) => onSetDetailsPanel({ type: 'subscription-event', event })}
      onTaskSelect={(task) => onSetDetailsPanel(createTaskDetailsState(task, tasks, calendarTasks))}
      onMoveRange={onMoveRange}
      onRescheduleTask={onRescheduleTask}
      onToday={onToday}
    />
  </div>
);
