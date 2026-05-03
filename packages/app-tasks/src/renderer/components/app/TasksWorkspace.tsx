import type { CalendarDateRange, CalendarDayItems } from '@tnet/app-tasks/shared/calendarView';
import type {
  CalendarEventOccurrence,
  CalendarSource,
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
import styles from './TasksWorkspace.module.css';

export interface TasksWorkspaceProps {
  calendarItems: CalendarDayItems[];
  calendarTasks: TaskItem[];
  categoryColors: Record<string, string>;
  completedTasks: TaskItem[];
  completedSubscribedTasks: SubscribedTaskOccurrence[];
  currentDate: string;
  focusDate: string;
  todayEvents: Array<LocalEvent | CalendarEventOccurrence>;
  todaySubscribedTasks: SubscribedTaskOccurrence[];
  todayTasks: TaskItem[];
  tasks: TaskItem[];
  undatedTasks: TaskItem[];
  upcomingDeadlines: Array<TaskItem | SubscribedTaskOccurrence>;
  sourceColors: Record<CalendarSource['id'], string>;
  view: TasksDefaultView;
  visibleRange: CalendarDateRange;
  onCompleteTask: (taskId: string, completed: boolean) => void;
  onCompleteSubscribedTask: (occurrenceId: string, completed: boolean) => void;
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
  categoryColors,
  completedTasks,
  completedSubscribedTasks,
  currentDate,
  focusDate,
  todayEvents,
  todaySubscribedTasks,
  todayTasks,
  tasks,
  undatedTasks,
  upcomingDeadlines,
  sourceColors,
  view,
  visibleRange,
  onCompleteTask,
  onCompleteSubscribedTask,
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
      completedSubscribedTasks={completedSubscribedTasks}
      categoryColors={categoryColors}
      sourceColors={sourceColors}
      todayEvents={todayEvents}
      todaySubscribedTasks={todaySubscribedTasks}
      todayTasks={todayTasks}
      undatedTasks={undatedTasks}
      upcomingDeadlines={upcomingDeadlines}
      onComplete={onCompleteTask}
      onCompleteReadOnlyTask={onCompleteSubscribedTask}
      onDelete={onDeleteTask}
      onEdit={onEditTask}
      onEventOpen={(event) => openEventDetails(event, onSetDetailsPanel)}
      onReadOnlyTaskOpen={(task) => onSetDetailsPanel({ type: 'subscription-task', task })}
      onTaskOpen={(task) => onSetDetailsPanel({ type: 'task-detail', task })}
    />
    <TasksCalendar
      currentDate={currentDate}
      categoryColors={categoryColors}
      endDate={visibleRange.endDate}
      focusDate={focusDate}
      items={calendarItems}
      sourceColors={sourceColors}
      showCurrentTime={view !== 'month'}
      startDate={visibleRange.startDate}
      view={view}
      onDateSelect={onSelectQuickDate}
      onLocalEventSelect={(event) => onSetDetailsPanel({ type: 'event-detail', event })}
      onSubscribedEventSelect={(event) => onSetDetailsPanel({ type: 'subscription-event', event })}
      onTaskSelect={(task) => {
        if (task.kind === 'subscribed-task') {
          onSetDetailsPanel({ type: 'subscription-task', task: task.task });
          return;
        }
        onSetDetailsPanel(createTaskDetailsState(task.task, tasks, calendarTasks));
      }}
      onMoveRange={onMoveRange}
      onRescheduleTask={onRescheduleTask}
      onToday={onToday}
    />
  </div>
);
