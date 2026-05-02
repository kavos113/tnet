import { useEffect, useState } from 'react';
import {
  SettingsActions,
  SettingsDialogShell,
  SettingsPrimaryButton,
  SettingsSecondaryButton
} from '@tnet/ui/settings';
import type { RssGlobalSettings } from '@tnet/app-rss/shared/config';
import { defaultRssGlobalSettings, normalizeRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { rssTnetApi } from '../rssTnetApi';
import { setRssError, setRssSettings } from '../rssSlice';
import { useRssDispatch, useRssSelector } from '../storeHooks';
import styles from './RssSettingsDialog.module.css';

interface RssSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPageProps {
  onClose: () => void;
}

export const RssSettingsDialog = ({
  isOpen,
  onClose
}: RssSettingsDialogProps): React.JSX.Element | null => (
  <SettingsDialogShell
    isOpen={isOpen}
    onClose={onClose}
    title="RSS Settings"
    ariaLabel="RSS Settings"
  >
    <RssGlobalSettingsPage onClose={onClose} />
  </SettingsDialogShell>
);

export const RssGlobalSettingsPage = ({ onClose }: SettingsPageProps): React.JSX.Element => {
  const dispatch = useRssDispatch();
  const currentSettings = useRssSelector((state) => state.rss.settings);
  const [draft, setDraft] = useState<RssGlobalSettings>(currentSettings);

  useEffect(() => {
    let canceled = false;
    rssTnetApi.rss.config
      .loadGlobal()
      .then((config) => {
        if (!canceled) setDraft(config.settings);
      })
      .catch(() => {
        if (!canceled) setDraft(defaultRssGlobalSettings());
      });
    return () => {
      canceled = true;
    };
  }, []);

  const update = <Key extends keyof RssGlobalSettings>(
    key: Key,
    value: RssGlobalSettings[Key]
  ): void => {
    setDraft((prev) => normalizeRssGlobalSettings({ ...prev, [key]: value }));
  };

  const save = async (): Promise<void> => {
    const settings = normalizeRssGlobalSettings(draft);
    await rssTnetApi.rss.config.saveGlobal({ settings });
    dispatch(setRssSettings(settings));
    onClose();
  };

  return (
    <div className={styles.root}>
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
      <section className={styles.section}>
        <h3>Display</h3>
        <label className={styles.field}>
          <span>Summary lines</span>
          <input
            type="number"
            min={1}
            max={8}
            value={draft.itemSummaryLineClamp}
            onChange={(event) => update('itemSummaryLineClamp', Number(event.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Font family</span>
          <input
            value={draft.fontFamily}
            onChange={(event) => update('fontFamily', event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Font size px</span>
          <input
            type="number"
            min={11}
            max={22}
            value={draft.fontSizePx}
            onChange={(event) => update('fontSizePx', Number(event.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Line height</span>
          <input
            type="number"
            min={1.2}
            max={2}
            step={0.05}
            value={draft.lineHeight}
            onChange={(event) => update('lineHeight', Number(event.target.value))}
          />
        </label>
      </section>
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            save().catch((error: unknown) => {
              dispatch(setRssError(error instanceof Error ? error.message : String(error)));
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </div>
  );
};
