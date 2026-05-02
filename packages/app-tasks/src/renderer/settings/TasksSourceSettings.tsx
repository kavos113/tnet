import { useEffect, useState } from 'react';
import { SettingsEmptyMessage, SettingsSection } from '@tnet/ui/settings';
import { tasksTnetApi } from '../api/tasksTnetApi';
import { useTasksDispatch, useTasksSelector } from '../state/storeHooks';
import { setTasksCalendarSources, setTasksError } from '../state/tasksSlice';
import { TasksSourceForm } from './TasksSourceForm';
import { type GoogleAuthorizationDraft, TasksSourceRow } from './TasksSourceRow';
import { emptySourceDraft, sourceDraftFromSource, type SourceDraft } from './sourceSettingsDraft';
import styles from './TasksSourceSettings.module.css';

export const TasksSourceSettings = (): React.JSX.Element => {
  const dispatch = useTasksDispatch();
  const sources = useTasksSelector((state) => state.tasks.calendarSources);
  const [draft, setDraft] = useState<SourceDraft>(emptySourceDraft);
  const [googleAuthorization, setGoogleAuthorization] = useState<GoogleAuthorizationDraft>();

  useEffect(() => {
    tasksTnetApi.tasks.calendarSources
      .list()
      .then((sources) => dispatch(setTasksCalendarSources(sources)))
      .catch((error: unknown) => {
        console.error('Failed to load calendar sources', error);
      });
  }, [dispatch]);

  const saveSource = async (): Promise<void> => {
    if (!draft.name.trim()) return;
    const uri = draft.type === 'google-calendar' ? draft.uri.trim() || 'primary' : draft.uri;
    if (!uri.trim()) return;
    const itemKind = draft.purpose === 'holiday' ? 'event' : draft.itemKind;
    const source = await tasksTnetApi.tasks.calendarSources.save({
      id: draft.id,
      name: draft.name,
      type: draft.type,
      itemKind,
      purpose: draft.purpose,
      uri,
      color: draft.color || undefined,
      enabled: draft.enabled,
      authType: draft.authType,
      username: draft.authType === 'basic' ? draft.username : undefined,
      password: draft.authType === 'basic' ? draft.password || undefined : undefined,
      passwordSecretId: draft.passwordSecretId
    });
    setDraft(emptySourceDraft());
    const syncResult = await tasksTnetApi.tasks.sync.manual({ sourceId: source.id });
    dispatch(setTasksCalendarSources(syncResult.sources));
  };

  const syncSource = async (sourceId?: string): Promise<void> => {
    const result = await tasksTnetApi.tasks.sync.manual(sourceId ? { sourceId } : undefined);
    dispatch(setTasksCalendarSources(result.sources));
  };

  const removeSource = async (sourceId: string): Promise<void> => {
    await tasksTnetApi.tasks.calendarSources.remove({ sourceId });
    dispatch(setTasksCalendarSources(sources.filter((source) => source.id !== sourceId)));
    if (googleAuthorization?.sourceId === sourceId) setGoogleAuthorization(undefined);
  };

  const startGoogleAuthorization = async (sourceId: string): Promise<void> => {
    try {
      const result = await tasksTnetApi.tasks.calendarSources.authorizeGoogle({ sourceId });
      if (result.source) {
        dispatch(
          setTasksCalendarSources([
            ...sources.filter((source) => source.id !== result.source?.id),
            result.source
          ])
        );
      }
    } finally {
      setGoogleAuthorization(undefined);
    }
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
              <TasksSourceRow
                key={source.id}
                googleAuthorization={
                  googleAuthorization?.sourceId === source.id ? googleAuthorization : undefined
                }
                source={source}
                onEdit={() => setDraft(sourceDraftFromSource(source))}
                onGoogleAuthorize={() => {
                  setGoogleAuthorization({ sourceId: source.id });
                  runAction(() => startGoogleAuthorization(source.id));
                }}
                onRemove={() => runAction(() => removeSource(source.id))}
                onSync={() => runAction(() => syncSource(source.id))}
              />
            ))}
          </div>
        ) : (
          <SettingsEmptyMessage>No calendar subscriptions configured.</SettingsEmptyMessage>
        )}
        <TasksSourceForm
          draft={draft}
          onCancel={() => setDraft(emptySourceDraft())}
          onChange={setDraft}
          onSave={() => runAction(saveSource)}
          onSyncAll={() => runAction(() => syncSource())}
        />
      </div>
    </SettingsSection>
  );
};
