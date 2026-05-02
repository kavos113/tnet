import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { DeadlineSection, EventSection, TaskSection } from './TasksAgendaSections';
import styles from './TasksAgenda.module.css';

export interface TasksAgendaProps {
  completedTasks: TaskItem[];
  todayEvents: Array<LocalEvent | CalendarEventOccurrence>;
  todaySubscribedTasks: SubscribedTaskOccurrence[];
  todayTasks: TaskItem[];
  undatedTasks: TaskItem[];
  upcomingDeadlines: Array<TaskItem | SubscribedTaskOccurrence>;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onEventOpen: (event: LocalEvent | CalendarEventOccurrence) => void;
  onReadOnlyTaskOpen: (task: SubscribedTaskOccurrence) => void;
  onTaskOpen: (task: TaskItem) => void;
}

export const TasksAgenda = ({
  completedTasks,
  todayEvents,
  todaySubscribedTasks,
  todayTasks,
  undatedTasks,
  upcomingDeadlines,
  onComplete,
  onDelete,
  onEdit,
  onEventOpen,
  onReadOnlyTaskOpen,
  onTaskOpen
}: TasksAgendaProps): React.JSX.Element => (
  <div className={styles.column}>
    <TaskSection
      title="Today Tasks"
      tasks={todayTasks}
      readOnlyTasks={todaySubscribedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
    <EventSection title="Today Events" events={todayEvents} onEventOpen={onEventOpen} />
    <DeadlineSection
      title="Upcoming Deadlines"
      items={upcomingDeadlines}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
    <TaskSection
      title="No Deadline"
      tasks={undatedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
    <TaskSection
      title="Completed Tasks"
      tasks={completedTasks}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
  </div>
);
