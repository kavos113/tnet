import { useTasksDispatch, useTasksSelector } from '../../state/storeHooks';
import { setTasksCategoryFilter } from '../../state/tasksSlice';
import styles from './TasksSidebar.module.css';

export interface TasksSidebarProps {
  onOpenTasksSettings?: () => void;
}

export const TasksSidebar = ({
  onOpenTasksSettings = () => undefined
}: TasksSidebarProps): React.JSX.Element => {
  const dispatch = useTasksDispatch();
  const tasks = useTasksSelector((state) => state.tasks.tasks);
  const categories = useTasksSelector((state) => state.tasks.categories);
  const categoryFilter = useTasksSelector((state) => state.tasks.categoryFilter);
  const openTasks = tasks.filter((task) => !task.completedAt);

  const categoryCounts = new Map<string, number>();
  for (const task of openTasks) {
    if (!task.category) continue;
    categoryCounts.set(task.category, (categoryCounts.get(task.category) ?? 0) + 1);
  }

  return (
    <aside className={styles.panel} aria-label="Tasks navigation">
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.title}>Tasks</span>
          <span className="material-icons-round" aria-hidden="true">
            task_alt
          </span>
        </header>
        <div className={styles.actions}>
          <button type="button" className={styles.subscriptionButton} onClick={onOpenTasksSettings}>
            <span className="material-icons-round" aria-hidden="true">
              add
            </span>
            <span>Add subscription</span>
          </button>
        </div>
        <div className={styles.summary}>
          <span className={styles.summaryValue}>{openTasks.length}</span>
          <span className={styles.summaryLabel}>Open Tasks</span>
        </div>
        <section className={styles.section} aria-label="Category filters">
          <span className={styles.sectionTitle}>Categories</span>
          <button
            type="button"
            className={`${styles.filterButton} ${!categoryFilter ? styles.filterButtonActive : ''}`}
            onClick={() => dispatch(setTasksCategoryFilter(undefined))}
          >
            <span className={styles.filterName}>All</span>
            <span className={styles.filterCount}>{openTasks.length}</span>
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={`${styles.filterButton} ${
                categoryFilter === category ? styles.filterButtonActive : ''
              }`}
              onClick={() => dispatch(setTasksCategoryFilter(category))}
            >
              <span className={styles.filterName}>{category}</span>
              <span className={styles.filterCount}>{categoryCounts.get(category) ?? 0}</span>
            </button>
          ))}
          {categories.length === 0 ? (
            <p className={styles.emptyMessage}>No categories yet.</p>
          ) : null}
        </section>
      </div>
    </aside>
  );
};
