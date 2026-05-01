import type { TaskDraft } from './tasksDraft';
import styles from './TasksQuickAddForm.module.css';

export interface TasksQuickAddFormProps {
  categories: string[];
  draft: TaskDraft;
  isCategoryCompletionEnabled: boolean;
  onCancelEdit: () => void;
  onDraftChange: (draft: TaskDraft) => void;
  onSubmit: () => void;
}

export const TasksQuickAddForm = ({
  categories,
  draft,
  isCategoryCompletionEnabled,
  onCancelEdit,
  onDraftChange,
  onSubmit
}: TasksQuickAddFormProps): React.JSX.Element => {
  const updateDraft = <Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]): void => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <input
        aria-label="Task title"
        placeholder="Task"
        value={draft.title}
        onChange={(event) => updateDraft('title', event.target.value)}
      />
      <input
        aria-label="Deadline date"
        type="date"
        value={draft.deadlineDate}
        onChange={(event) => updateDraft('deadlineDate', event.target.value)}
      />
      <input
        aria-label="Deadline time"
        type="time"
        value={draft.deadlineTime}
        onChange={(event) => updateDraft('deadlineTime', event.target.value)}
        disabled={!draft.deadlineDate}
      />
      <input
        aria-label="Category"
        list={isCategoryCompletionEnabled ? 'tasks-category-suggestions' : undefined}
        placeholder="Category"
        value={draft.category}
        onChange={(event) => updateDraft('category', event.target.value)}
      />
      <input
        aria-label="Reminder minutes"
        type="number"
        min={1}
        placeholder="Reminder"
        value={draft.reminderMinutesBefore}
        onChange={(event) => updateDraft('reminderMinutesBefore', event.target.value)}
      />
      <select
        aria-label="Recurrence"
        value={draft.recurrenceRule}
        onChange={(event) => updateDraft('recurrenceRule', event.target.value)}
      >
        <option value="">Once</option>
        <option value="FREQ=DAILY">Daily</option>
        <option value="FREQ=WEEKLY">Weekly</option>
        <option value="FREQ=MONTHLY">Monthly</option>
      </select>
      <button type="submit" className={styles.primaryButton} disabled={!draft.title.trim()}>
        {draft.id ? 'Save' : 'Add'}
      </button>
      <input
        className={styles.wide}
        aria-label="Linked entity"
        placeholder="Linked entity"
        value={draft.linkedEntityId}
        onChange={(event) => updateDraft('linkedEntityId', event.target.value)}
      />
      <input
        className={styles.wide}
        aria-label="Source URL"
        placeholder="Source URL"
        value={draft.sourceUrl}
        onChange={(event) => updateDraft('sourceUrl', event.target.value)}
      />
      {draft.id ? (
        <button type="button" className={styles.secondaryButton} onClick={onCancelEdit}>
          Cancel
        </button>
      ) : null}
      {isCategoryCompletionEnabled ? (
        <datalist id="tasks-category-suggestions">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      ) : null}
    </form>
  );
};
