import { useEffect, useMemo, useState } from 'react';
import type { TasksDefaultView } from '@tnet/app-tasks/shared/config';
import {
  addLocalDays,
  compareTaskDeadlines,
  compareUndatedTasks,
  isTaskDeadlineInRange,
  toLocalDateString
} from '@tnet/app-tasks/shared/dateHelpers';
import type { TaskItem } from '@tnet/app-tasks/shared/tasksTypes';
import {
  removeTask,
  setTaskCategories,
  setTasksCurrentDate,
  setTasksError,
  setTasksView,
  upsertTask
} from './tasksSlice';
import { tasksTnetApi } from './tasksTnetApi';
import { useTasksDispatch, useTasksSelector } from './storeHooks';
import styles from './TasksApp.module.css';

interface QuickAddDraft {
  title: string;
  deadlineDate: string;
  deadlineTime: string;
  category: string;
}

const emptyDraft: QuickAddDraft = {
  title: '',
  deadlineDate: '',
  deadlineTime: '',
  category: ''
};

export const TasksApp = (): React.JSX.Element => {
  const dispatch = useTasksDispatch();
  const tasks = useTasksSelector((state) => state.tasks.tasks);
  const categories = useTasksSelector((state) => state.tasks.categories);
  const categoryFilter = useTasksSelector((state) => state.tasks.categoryFilter);
  const currentDate = useTasksSelector((state) => state.tasks.currentDate);
  const error = useTasksSelector((state) => state.tasks.error);
  const isRestored = useTasksSelector((state) => state.tasks.isRestored);
  const settings = useTasksSelector((state) => state.tasks.settings);
  const view = useTasksSelector((state) => state.tasks.view);
  const [clock, setClock] = useState(() => new Date());
  const [draft, setDraft] = useState<QuickAddDraft>(emptyDraft);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) => !categoryFilter || task.category === categoryFilter)
        .filter((task) => !task.completedAt),
    [categoryFilter, tasks]
  );

  const todayTasks = useMemo(
    () =>
      visibleTasks.filter((task) => task.deadlineDate === currentDate).sort(compareTaskDeadlines),
    [currentDate, visibleTasks]
  );

  const undatedTasks = useMemo(
    () => visibleTasks.filter((task) => !task.deadlineDate).sort(compareUndatedTasks),
    [visibleTasks]
  );

  const calendarDates = useMemo(
    () => getVisibleCalendarDates(currentDate, view, settings.weekStartsOn),
    [currentDate, settings.weekStartsOn, view]
  );

  const calendarStart = calendarDates[0] ?? currentDate;
  const calendarEnd = calendarDates[calendarDates.length - 1] ?? currentDate;
  const calendarTasks = visibleTasks
    .filter((task) => isTaskDeadlineInRange(task, calendarStart, calendarEnd))
    .sort(compareTaskDeadlines);

  const reloadCategories = async (): Promise<void> => {
    dispatch(setTaskCategories(await tasksTnetApi.tasks.categories.list()));
  };

  const createTask = async (): Promise<void> => {
    const title = draft.title.trim();
    if (!title) return;
    const task = await tasksTnetApi.tasks.tasks.save({
      title,
      deadlineDate: draft.deadlineDate || undefined,
      deadlineTime: draft.deadlineDate ? draft.deadlineTime || undefined : undefined,
      category: draft.category.trim() || undefined
    });
    dispatch(upsertTask(task));
    setDraft(emptyDraft);
    await reloadCategories();
  };

  const completeTask = async (taskId: string, completed: boolean): Promise<void> => {
    const task = await tasksTnetApi.tasks.tasks.complete({ taskId, completed });
    dispatch(upsertTask(task));
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await tasksTnetApi.tasks.tasks.remove({ taskId });
    dispatch(removeTask(taskId));
    await reloadCategories();
  };

  const runAction = (action: () => Promise<void>): void => {
    action().catch((error: unknown) => {
      console.error('Tasks action failed', error);
      dispatch(setTasksError(error instanceof Error ? error.message : String(error)));
    });
  };

  const moveCurrentDate = (days: number): void => {
    dispatch(setTasksCurrentDate(addLocalDays(currentDate, days)));
  };

  if (!isRestored) {
    return (
      <main className={styles.root} aria-label="Tasks">
        <div className={styles.section}>
          <p className={styles.emptyMessage}>Restoring tasks...</p>
        </div>
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
        <div className={styles.viewControls} aria-label="Task view">
          {(['today', 'week', 'month'] as TasksDefaultView[]).map((viewId) => (
            <button
              type="button"
              key={viewId}
              className={`${styles.viewButton} ${view === viewId ? styles.viewButtonActive : ''}`}
              onClick={() => dispatch(setTasksView(viewId))}
            >
              {viewLabels[viewId]}
            </button>
          ))}
        </div>
      </header>
      <form
        className={styles.quickAdd}
        onSubmit={(event) => {
          event.preventDefault();
          runAction(createTask);
        }}
      >
        <input
          aria-label="Task title"
          placeholder="Task"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
        <input
          aria-label="Deadline date"
          type="date"
          value={draft.deadlineDate}
          onChange={(event) =>
            setDraft((current) => ({ ...current, deadlineDate: event.target.value }))
          }
        />
        <input
          aria-label="Deadline time"
          type="time"
          value={draft.deadlineTime}
          onChange={(event) =>
            setDraft((current) => ({ ...current, deadlineTime: event.target.value }))
          }
          disabled={!draft.deadlineDate}
        />
        <input
          aria-label="Category"
          list={settings.categoryCompletionEnabled ? 'tasks-category-suggestions' : undefined}
          placeholder="Category"
          value={draft.category}
          onChange={(event) =>
            setDraft((current) => ({ ...current, category: event.target.value }))
          }
        />
        {settings.categoryCompletionEnabled ? (
          <datalist id="tasks-category-suggestions">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        ) : null}
        <button type="submit" className={styles.primaryButton} disabled={!draft.title.trim()}>
          Add
        </button>
      </form>
      <div className={styles.content}>
        <div className={styles.taskColumn}>
          {error ? <p className={styles.error}>{error}</p> : null}
          <TaskSection
            title="Today"
            tasks={todayTasks}
            onComplete={(taskId, completed) => runAction(() => completeTask(taskId, completed))}
            onDelete={(taskId) => runAction(() => deleteTask(taskId))}
          />
          <TaskSection
            title="No Deadline"
            tasks={undatedTasks}
            onComplete={(taskId, completed) => runAction(() => completeTask(taskId, completed))}
            onDelete={(taskId) => runAction(() => deleteTask(taskId))}
          />
        </div>
        <section className={styles.calendarPane} aria-label="Calendar">
          <header className={styles.calendarHeader}>
            <h2 className={styles.calendarTitle}>
              {formatCalendarTitle(calendarStart, calendarEnd)}
            </h2>
            <div className={styles.viewControls}>
              <button
                type="button"
                className={`${styles.iconButton} material-icons-round`}
                aria-label="Previous range"
                onClick={() => moveCurrentDate(view === 'month' ? -28 : -7)}
              >
                chevron_left
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => dispatch(setTasksCurrentDate(toLocalDateString()))}
              >
                Today
              </button>
              <button
                type="button"
                className={`${styles.iconButton} material-icons-round`}
                aria-label="Next range"
                onClick={() => moveCurrentDate(view === 'month' ? 28 : 7)}
              >
                chevron_right
              </button>
            </div>
          </header>
          <div className={styles.calendarGrid}>
            {calendarDates.map((date) => (
              <CalendarCell
                key={date}
                date={date}
                isToday={date === toLocalDateString()}
                tasks={calendarTasks.filter((task) => task.deadlineDate === date)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

const TaskSection = ({
  title,
  tasks,
  onComplete,
  onDelete
}: {
  title: string;
  tasks: TaskItem[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}): React.JSX.Element => (
  <section className={styles.section} aria-label={title}>
    <header className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <span className={styles.count}>{tasks.length}</span>
    </header>
    {tasks.length > 0 ? (
      <ul className={styles.taskList}>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} />
        ))}
      </ul>
    ) : (
      <p className={styles.emptyMessage}>No tasks.</p>
    )}
  </section>
);

const TaskRow = ({
  task,
  onComplete,
  onDelete
}: {
  task: TaskItem;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}): React.JSX.Element => (
  <li className={styles.taskItem}>
    <input
      aria-label={`Complete ${task.title}`}
      className={styles.taskCheckbox}
      type="checkbox"
      checked={Boolean(task.completedAt)}
      onChange={(event) => onComplete(task.id, event.target.checked)}
    />
    <div className={styles.taskBody}>
      <span className={`${styles.taskTitle} ${task.completedAt ? styles.taskTitleDone : ''}`}>
        {task.title}
      </span>
      <span className={styles.taskMeta}>
        {task.deadlineDate ? <span>{formatTaskDeadline(task)}</span> : null}
        {task.category ? <span className={styles.categoryPill}>{task.category}</span> : null}
      </span>
    </div>
    <button
      type="button"
      className={`${styles.iconButton} material-icons-round`}
      aria-label={`Delete ${task.title}`}
      onClick={() => onDelete(task.id)}
    >
      delete
    </button>
  </li>
);

const CalendarCell = ({
  date,
  isToday,
  tasks
}: {
  date: string;
  isToday: boolean;
  tasks: TaskItem[];
}): React.JSX.Element => (
  <div className={`${styles.calendarCell} ${isToday ? styles.calendarCellToday : ''}`}>
    <div className={styles.calendarDayLabel}>
      <span>{formatShortWeekday(date)}</span>
      <span>{Number(date.slice(8, 10))}</span>
    </div>
    <div className={styles.calendarItems}>
      {tasks.map((task) => (
        <span className={styles.calendarTask} key={task.id} title={task.title}>
          {task.deadlineTime ? `${task.deadlineTime} ` : ''}
          {task.title}
        </span>
      ))}
    </div>
  </div>
);

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

const formatTaskDeadline = (task: TaskItem): string =>
  task.deadlineTime ? `${task.deadlineDate} ${task.deadlineTime}` : (task.deadlineDate ?? '');

const formatShortWeekday = (date: string): string =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T00:00:00`));

const formatCalendarTitle = (startDate: string, endDate: string): string =>
  startDate === endDate ? startDate : `${startDate} - ${endDate}`;

const getVisibleCalendarDates = (
  currentDate: string,
  view: TasksDefaultView,
  weekStartsOn: number
): string[] => {
  if (view === 'today') return [currentDate];
  if (view === 'month') return getMonthDates(currentDate, weekStartsOn);

  const current = new Date(`${currentDate}T00:00:00`);
  const offset = (current.getDay() - weekStartsOn + 7) % 7;
  const startDate = addLocalDays(currentDate, -offset);
  return Array.from({ length: 7 }, (_, index) => addLocalDays(startDate, index));
};

const getMonthDates = (currentDate: string, weekStartsOn: number): string[] => {
  const current = new Date(`${currentDate}T00:00:00`);
  const firstOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const firstDate = toLocalDateString(firstOfMonth);
  const leadingOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addLocalDays(firstDate, -leadingOffset);
  return Array.from({ length: 42 }, (_, index) => addLocalDays(gridStart, index));
};
