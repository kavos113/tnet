import { SettingsPrimaryButton, SettingsSecondaryButton } from '@tnet/ui/settings';
import type {
  CalendarSourceAuthType,
  CalendarSourceItemKind,
  CalendarSourcePurpose,
  CalendarSourceType
} from '@tnet/app-tasks/shared/tasksTypes';
import { ColorPickerField } from './ColorPickerField';
import type { SourceDraft } from './sourceSettingsDraft';
import styles from './TasksSourceSettings.module.css';

export const TasksSourceForm = ({
  draft,
  onCancel,
  onChange,
  onSave,
  onSyncAll
}: {
  draft: SourceDraft;
  onCancel: () => void;
  onChange: (draft: SourceDraft) => void;
  onSave: () => void;
  onSyncAll: () => void;
}): React.JSX.Element => {
  const update = <Key extends keyof SourceDraft>(key: Key, value: SourceDraft[Key]): void => {
    const next = { ...draft, [key]: value };
    if (key === 'purpose' && value === 'holiday') next.itemKind = 'event';
    onChange(next);
  };

  return (
    <>
      <div className={styles.formGrid}>
        <label>
          Name
          <input value={draft.name} onChange={(event) => update('name', event.target.value)} />
        </label>
        <label>
          Type
          <select
            value={draft.type}
            onChange={(event) => update('type', event.target.value as CalendarSourceType)}
          >
            <option value="ics-url">iCal URL</option>
            <option value="ics-file">Local .ics file</option>
            <option value="caldav">CalDAV</option>
            <option value="google-calendar">Google Calendar</option>
          </select>
        </label>
        <label>
          Items
          <select
            value={draft.itemKind}
            onChange={(event) => update('itemKind', event.target.value as CalendarSourceItemKind)}
            disabled={draft.purpose === 'holiday'}
          >
            <option value="event">Event calendar</option>
            <option value="task">Task calendar</option>
          </select>
        </label>
        <label>
          Purpose
          <select
            value={draft.purpose}
            onChange={(event) => update('purpose', event.target.value as CalendarSourcePurpose)}
          >
            <option value="calendar">Calendar</option>
            <option value="holiday">Holiday</option>
          </select>
        </label>
        <label>
          URI
          <input
            placeholder={
              draft.type === 'ics-file'
                ? 'C:\\calendar\\work.ics'
                : draft.type === 'google-calendar'
                  ? 'primary'
                  : 'https://...'
            }
            value={draft.uri}
            onChange={(event) => update('uri', event.target.value)}
          />
        </label>
        <ColorPickerField
          label="Color"
          value={draft.color || undefined}
          onChange={(color) => update('color', color ?? '')}
        />
        <label>
          Authentication
          <select
            value={draft.authType}
            onChange={(event) => update('authType', event.target.value as CalendarSourceAuthType)}
          >
            <option value="none">None</option>
            <option value="basic">Basic</option>
          </select>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => update('enabled', event.target.checked)}
          />
          Enabled
        </label>
        {draft.authType === 'basic' ? (
          <>
            <label>
              Username
              <input
                value={draft.username}
                onChange={(event) => update('username', event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder={draft.passwordSecretId ? 'Saved password' : ''}
                value={draft.password}
                onChange={(event) => update('password', event.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
      <div className={styles.actions}>
        <SettingsSecondaryButton onClick={onSyncAll}>Sync All</SettingsSecondaryButton>
        {draft.id ? (
          <SettingsSecondaryButton onClick={onCancel}>Cancel Edit</SettingsSecondaryButton>
        ) : null}
        <SettingsPrimaryButton onClick={onSave}>
          {draft.id ? 'Save Subscription' : 'Add Subscription'}
        </SettingsPrimaryButton>
      </div>
    </>
  );
};
