import { SettingsIconButton } from '@tnet/ui/settings';
import type { CalendarSource } from '@tnet/app-tasks/shared/tasksTypes';
import styles from './TasksSourceSettings.module.css';

export interface GoogleAuthorizationDraft {
  sourceId: string;
}

export const TasksSourceRow = ({
  googleAuthorization,
  source,
  onEdit,
  onGoogleAuthorize,
  onRemove,
  onSync
}: {
  googleAuthorization?: GoogleAuthorizationDraft;
  source: CalendarSource;
  onEdit: () => void;
  onGoogleAuthorize: () => void;
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
        {source.purpose === 'holiday' ? ' - Holiday source' : ''}
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
    {source.type === 'google-calendar' ? (
      <SettingsIconButton
        className="material-icons-round"
        aria-label={`Authorize ${source.name}`}
        onClick={onGoogleAuthorize}
      >
        key
      </SettingsIconButton>
    ) : null}
    <SettingsIconButton
      className="material-icons-round"
      aria-label={`Remove ${source.name}`}
      onClick={onRemove}
    >
      delete
    </SettingsIconButton>
    {googleAuthorization ? (
      <div className={styles.googleAuthPanel}>
        <span>Authorizing with Google...</span>
      </div>
    ) : null}
  </div>
);
