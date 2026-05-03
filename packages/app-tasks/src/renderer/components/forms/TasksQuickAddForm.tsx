import type { LocalEventDraft } from '../../state/localEventDraft';
import type { TaskDraft } from '../../state/tasksDraft';
import styles from './TasksQuickAddForm.module.css';

export type QuickAddKind = 'task' | 'event';

export interface TasksQuickAddFormProps {
  categories: string[];
  eventDraft: LocalEventDraft;
  draft: TaskDraft;
  isCategoryCompletionEnabled: boolean;
  kind: QuickAddKind;
  onCancelEdit: () => void;
  onDraftChange: (draft: TaskDraft) => void;
  onEventDraftChange: (draft: LocalEventDraft) => void;
  onKindChange: (kind: QuickAddKind) => void;
  onOpenDetails: () => void;
  onSubmit: () => void;
}

export const TasksQuickAddForm = ({
  categories,
  eventDraft,
  draft,
  isCategoryCompletionEnabled,
  kind,
  onCancelEdit,
  onDraftChange,
  onEventDraftChange,
  onKindChange,
  onOpenDetails,
  onSubmit
}: TasksQuickAddFormProps): React.JSX.Element => {
  const updateDraft = <Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]): void => {
    onDraftChange({ ...draft, [key]: value });
  };
  const updateEventDraft = <Key extends keyof LocalEventDraft>(
    key: Key,
    value: LocalEventDraft[Key]
  ): void => {
    onEventDraftChange({ ...eventDraft, [key]: value });
  };
  const isTask = kind === 'task';
  const title = isTask ? draft.title : eventDraft.title;

  return (
    <form
      className={`${styles.form} ${isTask ? '' : styles.eventForm}`}
      aria-label="Quick add"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <select
        aria-label="Item type"
        value={kind}
        onChange={(event) => onKindChange(event.target.value as QuickAddKind)}
      >
        <option value="task">Task</option>
        <option value="event">Event</option>
      </select>
      <input
        aria-label={isTask ? 'Task title' : 'Event title'}
        placeholder={isTask ? 'Task' : 'Event'}
        value={title}
        onChange={(event) =>
          isTask
            ? updateDraft('title', event.target.value)
            : updateEventDraft('title', event.target.value)
        }
      />
      {isTask ? (
        <>
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
        </>
      ) : (
        <>
          <input
            aria-label="Event date"
            type="date"
            value={eventDraft.date}
            onChange={(event) => updateEventDraft('date', event.target.value)}
          />
          <input
            aria-label="Start"
            type="time"
            value={eventDraft.startTime}
            onChange={(event) => updateEventDraft('startTime', event.target.value)}
            disabled={eventDraft.allDay}
          />
          <input
            aria-label="End"
            type="time"
            value={eventDraft.endTime}
            onChange={(event) => updateEventDraft('endTime', event.target.value)}
            disabled={eventDraft.allDay}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={eventDraft.allDay}
              onChange={(event) => updateEventDraft('allDay', event.target.checked)}
            />
            All day
          </label>
        </>
      )}
      <button
        type="button"
        className={`${styles.iconButton} material-symbols-rounded`}
        aria-label={isTask ? 'Open task details' : 'Open event details'}
        onClick={onOpenDetails}
      >
        tune
      </button>
      <button type="submit" className={styles.primaryButton} disabled={!title.trim()}>
        {isTask
          ? draft.id
            ? 'Save Task'
            : 'Add Task'
          : eventDraft.id
            ? 'Save Event'
            : 'Add Event'}
      </button>
      {isTask && draft.id ? (
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
