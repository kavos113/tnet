import type { LocalEventDraft } from './localEventDraft';
import styles from './LocalEventEditor.module.css';

export interface LocalEventEditorProps {
  draft: LocalEventDraft;
  onCancel: () => void;
  onChange: (draft: LocalEventDraft) => void;
  onDelete?: () => void;
  onSave: () => void;
}

export const LocalEventEditor = ({
  draft,
  onCancel,
  onChange,
  onDelete,
  onSave
}: LocalEventEditorProps): React.JSX.Element => {
  const update = <Key extends keyof LocalEventDraft>(
    key: Key,
    value: LocalEventDraft[Key]
  ): void => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <section className={styles.editor} aria-label="Event editor">
      <label>
        Event title
        <input value={draft.title} onChange={(event) => update('title', event.target.value)} />
      </label>
      <label>
        Event date
        <input
          type="date"
          value={draft.date}
          onChange={(event) => update('date', event.target.value)}
        />
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={draft.allDay}
          onChange={(event) => update('allDay', event.target.checked)}
        />
        All day
      </label>
      {!draft.allDay ? (
        <>
          <label>
            Start
            <input
              type="time"
              value={draft.startTime}
              onChange={(event) => update('startTime', event.target.value)}
            />
          </label>
          <label>
            End
            <input
              type="time"
              value={draft.endTime}
              onChange={(event) => update('endTime', event.target.value)}
            />
          </label>
        </>
      ) : null}
      <label>
        Location
        <input
          value={draft.location}
          onChange={(event) => update('location', event.target.value)}
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
        {onDelete ? (
          <button type="button" className={styles.secondaryButton} onClick={onDelete}>
            Delete event
          </button>
        ) : null}
        <button type="button" className={styles.secondaryButton} onClick={onSave}>
          {draft.id ? 'Save event' : 'Create event'}
        </button>
      </div>
    </section>
  );
};
