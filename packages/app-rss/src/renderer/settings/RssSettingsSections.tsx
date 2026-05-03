import type { RssGlobalSettings } from '@tnet/app-rss/shared/config';
import styles from './RssSettingsDialog.module.css';

export type RssSettingsUpdate = <Key extends keyof RssGlobalSettings>(
  key: Key,
  value: RssGlobalSettings[Key]
) => void;

interface RssSettingsSectionProps {
  draft: RssGlobalSettings;
  update: RssSettingsUpdate;
}

export const SyncSettingsSection = ({
  draft,
  update
}: RssSettingsSectionProps): React.JSX.Element => (
  <section className={styles.section}>
    <h3>Sync</h3>
    <label className={styles.field}>
      <span>Sync interval minutes</span>
      <input
        type="number"
        min={5}
        max={1440}
        value={draft.syncIntervalMinutes}
        onChange={(event) => update('syncIntervalMinutes', Number(event.target.value))}
      />
    </label>
    <label className={styles.field}>
      <span>Fetch timeout seconds</span>
      <input
        type="number"
        min={3}
        max={120}
        value={draft.fetchTimeoutSeconds}
        onChange={(event) => update('fetchTimeoutSeconds', Number(event.target.value))}
      />
    </label>
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={draft.syncOnStartup}
        onChange={(event) => update('syncOnStartup', event.target.checked)}
      />
      <span>Sync on startup</span>
    </label>
  </section>
);

export const ReadingSettingsSection = ({
  draft,
  update
}: RssSettingsSectionProps): React.JSX.Element => (
  <section className={styles.section}>
    <h3>Reading</h3>
    <label className={styles.field}>
      <span>Default filter</span>
      <select
        value={draft.defaultFilter}
        onChange={(event) =>
          update('defaultFilter', event.target.value === 'all' ? 'all' : 'unread')
        }
      >
        <option value="unread">Unread</option>
        <option value="all">All</option>
      </select>
    </label>
    <label className={styles.field}>
      <span>Retention days</span>
      <input
        type="number"
        min={1}
        max={3650}
        value={draft.retentionDays}
        onChange={(event) => update('retentionDays', Number(event.target.value))}
      />
    </label>
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={draft.markReadOnOpen}
        onChange={(event) => update('markReadOnOpen', event.target.checked)}
      />
      <span>Mark item read on open</span>
    </label>
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={draft.confirmExternalLinks}
        onChange={(event) => update('confirmExternalLinks', event.target.checked)}
      />
      <span>Confirm before opening external links</span>
    </label>
  </section>
);

export const DisplaySettingsSection = ({
  draft,
  update
}: RssSettingsSectionProps): React.JSX.Element => (
  <section className={styles.section}>
    <h3>Display</h3>
    <label className={styles.field}>
      <span>Summary lines</span>
      <input
        type="number"
        min={0}
        max={8}
        value={draft.itemSummaryLineClamp}
        onChange={(event) => update('itemSummaryLineClamp', Number(event.target.value))}
      />
    </label>
    <label className={styles.field}>
      <span>Line height</span>
      <input
        type="number"
        min={1}
        max={3}
        step={0.05}
        value={draft.lineHeight}
        onChange={(event) => update('lineHeight', Number(event.target.value))}
      />
    </label>
  </section>
);
