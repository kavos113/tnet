import type { TaskDraft } from '../../state/tasksDraft';
import styles from './TaskDetailsForm.module.css';

export interface TaskDetailsFormProps {
  categories: string[];
  draft: TaskDraft;
  isCategoryCompletionEnabled: boolean;
  onCancel: () => void;
  onChange: (draft: TaskDraft) => void;
  onDelete?: () => void;
  onSave: () => void;
}

export const TaskDetailsForm = ({
  categories,
  draft,
  isCategoryCompletionEnabled,
  onCancel,
  onChange,
  onDelete,
  onSave
}: TaskDetailsFormProps): React.JSX.Element => {
  const updateDraft = <Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]): void => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <label>
        Task title
        <input
          aria-label="Detail task title"
          value={draft.title}
          onChange={(event) => updateDraft('title', event.target.value)}
        />
      </label>
      <label>
        Notes
        <textarea
          value={draft.notes}
          onChange={(event) => updateDraft('notes', event.target.value)}
        />
      </label>
      <div className={styles.row}>
        <label>
          Deadline date
          <input
            type="date"
            value={draft.deadlineDate}
            onChange={(event) => updateDraft('deadlineDate', event.target.value)}
          />
        </label>
        <label>
          Deadline time
          <input
            type="time"
            value={draft.deadlineTime}
            onChange={(event) => updateDraft('deadlineTime', event.target.value)}
            disabled={!draft.deadlineDate}
          />
        </label>
      </div>
      <label>
        Category
        <input
          list={isCategoryCompletionEnabled ? 'tasks-detail-category-suggestions' : undefined}
          value={draft.category}
          onChange={(event) => updateDraft('category', event.target.value)}
        />
      </label>
      <label>
        Reminder minutes
        <input
          type="number"
          min={1}
          value={draft.reminderMinutesBefore}
          onChange={(event) => updateDraft('reminderMinutesBefore', event.target.value)}
        />
      </label>
      <label>
        Recurrence
        <select
          value={draft.recurrenceRule}
          onChange={(event) => updateDraft('recurrenceRule', event.target.value)}
        >
          <option value="">Once</option>
          <option value="FREQ=DAILY">Daily</option>
          <option value="FREQ=WEEKLY">Weekly</option>
          <option value="FREQ=MONTHLY">Monthly</option>
        </select>
      </label>
      <label>
        Linked entity
        <input
          value={draft.linkedEntityId}
          onChange={(event) => updateDraft('linkedEntityId', event.target.value)}
        />
      </label>
      <label>
        Source URL
        <input
          value={draft.sourceUrl}
          onChange={(event) => updateDraft('sourceUrl', event.target.value)}
        />
      </label>
      {isCategoryCompletionEnabled ? (
        <datalist id="tasks-detail-category-suggestions">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
        {onDelete ? (
          <button type="button" className={styles.secondaryButton} onClick={onDelete}>
            Delete task
          </button>
        ) : null}
        <button type="submit" className={styles.primaryButton} disabled={!draft.title.trim()}>
          {draft.id ? 'Save Task' : 'Add Task'}
        </button>
      </div>
    </form>
  );
};
