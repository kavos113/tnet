import { useEffect, useState } from 'react';
import {
  SettingsEmptyMessage,
  SettingsIconButton,
  SettingsPrimaryButton,
  SettingsSecondaryButton,
  SettingsSection
} from '@tnet/ui/settings';
import type {
  CalendarSource,
  CalendarSourceAuthType,
  CalendarSourceItemKind,
  CalendarSourceType
} from '@tnet/app-tasks/shared/tasksTypes';
import { setTasksCalendarSources, setTasksError } from '../tasksSlice';
import { tasksTnetApi } from '../tasksTnetApi';
import { useTasksDispatch, useTasksSelector } from '../storeHooks';
import styles from './TasksSourceSettings.module.css';

interface SourceDraft {
  id?: string;
  name: string;
  type: CalendarSourceType;
  itemKind: CalendarSourceItemKind;
  uri: string;
  color: string;
  enabled: boolean;
  authType: CalendarSourceAuthType;
  username: string;
  password: string;
  passwordSecretId?: string;
}

const emptyDraft = (): SourceDraft => ({
  name: '',
  type: 'ics-url',
  itemKind: 'event',
  uri: '',
  color: '',
  enabled: true,
  authType: 'none',
  username: '',
  password: ''
});

export const TasksSourceSettings = (): React.JSX.Element => {
  const dispatch = useTasksDispatch();
  const sources = useTasksSelector((state) => state.tasks.calendarSources);
  const [draft, setDraft] = useState<SourceDraft>(emptyDraft);

  useEffect(() => {
    tasksTnetApi.tasks.calendarSources
      .list()
      .then((sources) => dispatch(setTasksCalendarSources(sources)))
      .catch((error: unknown) => {
        console.error('Failed to load calendar sources', error);
      });
  }, [dispatch]);

  const saveSource = async (): Promise<void> => {
    if (!draft.name.trim() || !draft.uri.trim()) return;
    const source = await tasksTnetApi.tasks.calendarSources.save({
      id: draft.id,
      name: draft.name,
      type: draft.type,
      itemKind: draft.itemKind,
      uri: draft.uri,
      color: draft.color || undefined,
      enabled: draft.enabled,
      authType: draft.authType,
      username: draft.authType === 'basic' ? draft.username : undefined,
      password: draft.authType === 'basic' ? draft.password || undefined : undefined,
      passwordSecretId: draft.passwordSecretId
    });
    setDraft(emptyDraft());
    dispatch(
      setTasksCalendarSources([...sources.filter((current) => current.id !== source.id), source])
    );
  };

  const syncSource = async (sourceId?: string): Promise<void> => {
    const result = await tasksTnetApi.tasks.sync.manual(sourceId ? { sourceId } : undefined);
    dispatch(setTasksCalendarSources(result.sources));
  };

  const removeSource = async (sourceId: string): Promise<void> => {
    await tasksTnetApi.tasks.calendarSources.remove({ sourceId });
    dispatch(setTasksCalendarSources(sources.filter((source) => source.id !== sourceId)));
  };

  const runAction = (action: () => Promise<void>): void => {
    action().catch((error: unknown) => {
      console.error('Calendar source settings action failed', error);
      dispatch(setTasksError(error instanceof Error ? error.message : String(error)));
    });
  };

  return (
    <SettingsSection title="Calendar Subscriptions">
      <div className={styles.section}>
        {sources.length > 0 ? (
          <div className={styles.sourceList}>
            {sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                onEdit={() => setDraft(draftFromSource(source))}
                onRemove={() => runAction(() => removeSource(source.id))}
                onSync={() => runAction(() => syncSource(source.id))}
              />
            ))}
          </div>
        ) : (
          <SettingsEmptyMessage>No calendar subscriptions configured.</SettingsEmptyMessage>
        )}
        <SourceForm
          draft={draft}
          onCancel={() => setDraft(emptyDraft())}
          onChange={setDraft}
          onSave={() => runAction(saveSource)}
          onSyncAll={() => runAction(() => syncSource())}
        />
      </div>
    </SettingsSection>
  );
};

const SourceRow = ({
  source,
  onEdit,
  onRemove,
  onSync
}: {
  source: CalendarSource;
  onEdit: () => void;
  onRemove: () => void;
  onSync: () => void;
}): React.JSX.Element => (
  <div className={styles.sourceRow}>
    <div className={styles.sourceText}>
      <strong>{source.name}</strong>
      <span>
        {source.type} - {source.uri}
        {' - '}
        {source.itemKind === 'task' ? 'Task calendar' : 'Event calendar'}
      </span>
      {source.lastSyncError ? <span className={styles.error}>{source.lastSyncError}</span> : null}
    </div>
    <SettingsIconButton
      className="material-icons-round"
      aria-label={`Sync ${source.name}`}
      onClick={onSync}
    >
      sync
    </SettingsIconButton>
    <SettingsIconButton
      className="material-icons-round"
      aria-label={`Edit ${source.name}`}
      onClick={onEdit}
    >
      edit
    </SettingsIconButton>
    <SettingsIconButton
      className="material-icons-round"
      aria-label={`Remove ${source.name}`}
      onClick={onRemove}
    >
      delete
    </SettingsIconButton>
  </div>
);

const SourceForm = ({
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
    onChange({ ...draft, [key]: value });
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
          </select>
        </label>
        <label>
          Items
          <select
            value={draft.itemKind}
            onChange={(event) => update('itemKind', event.target.value as CalendarSourceItemKind)}
          >
            <option value="event">Event calendar</option>
            <option value="task">Task calendar</option>
          </select>
        </label>
        <label>
          URI
          <input
            placeholder={draft.type === 'ics-file' ? 'C:\\calendar\\work.ics' : 'https://...'}
            value={draft.uri}
            onChange={(event) => update('uri', event.target.value)}
          />
        </label>
        <label>
          Color
          <input value={draft.color} onChange={(event) => update('color', event.target.value)} />
        </label>
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

const draftFromSource = (source: CalendarSource): SourceDraft => ({
  id: source.id,
  name: source.name,
  type: source.type,
  itemKind: source.itemKind,
  uri: source.uri,
  color: source.color ?? '',
  enabled: source.enabled,
  authType: source.authType,
  username: source.username ?? '',
  password: '',
  passwordSecretId: source.passwordSecretId
});
