import type {
  CalendarEventOccurrence,
  LocalEvent,
  SubscribedTaskOccurrence,
  TaskItem
} from '@tnet/app-tasks/shared/tasksTypes';
import { DeadlineSection, EventSection, TaskSection } from './TasksAgendaSections';
import styles from './TasksAgenda.module.css';

export interface TasksAgendaProps {
  categoryColors: Record<string, string>;
  completedTasks: TaskItem[];
  sourceColors: Record<string, string>;
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
  categoryColors,
  sourceColors,
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
      categoryColors={categoryColors}
      sourceColors={sourceColors}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
    <EventSection
      title="Today Events"
      events={todayEvents}
      sourceColors={sourceColors}
      onEventOpen={onEventOpen}
    />
    <DeadlineSection
      title="Upcoming Deadlines"
      items={upcomingDeadlines}
      categoryColors={categoryColors}
      sourceColors={sourceColors}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
    <TaskSection
      title="No Deadline"
      tasks={undatedTasks}
      categoryColors={categoryColors}
      sourceColors={sourceColors}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
    <TaskSection
      title="Completed Tasks"
      tasks={completedTasks}
      categoryColors={categoryColors}
      sourceColors={sourceColors}
      onComplete={onComplete}
      onDelete={onDelete}
      onEdit={onEdit}
      onReadOnlyTaskOpen={onReadOnlyTaskOpen}
      onTaskOpen={onTaskOpen}
    />
  </div>
);
