import { useCallback } from 'react';
import { useSettingsDraft } from '@tnet/renderer-core/settings/useSettingsDraft';
import {
  SettingsActions,
  SettingsDialogShell,
  SettingsPrimaryButton,
  SettingsSecondaryButton
} from '@tnet/ui/settings';
import type { RssGlobalSettings } from '@tnet/app-rss/shared/config';
import { normalizeRssGlobalSettings } from '@tnet/app-rss/shared/config';
import { rssTnetApi } from '../rssTnetApi';
import { setRssError, setRssSettings } from '../rssSlice';
import { useRssDispatch, useRssSelector } from '../storeHooks';
import {
  DisplaySettingsSection,
  ReadingSettingsSection,
  SyncSettingsSection
} from './RssSettingsSections';
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
  const loadSettings = useCallback(
    async () => (await rssTnetApi.rss.config.loadGlobal()).settings,
    []
  );
  const onLoadError = useCallback(
    (error: unknown) => {
      dispatch(setRssError(error instanceof Error ? error.message : String(error)));
    },
    [dispatch]
  );
  const { draft, updateDraft: update } = useSettingsDraft<RssGlobalSettings>({
    initialDraft: currentSettings,
    load: loadSettings,
    normalize: normalizeRssGlobalSettings,
    onLoadError
  });

  const save = async (): Promise<void> => {
    const settings = normalizeRssGlobalSettings(draft);
    await rssTnetApi.rss.config.saveGlobal({ settings });
    dispatch(setRssSettings(settings));
    onClose();
  };

  return (
    <div className={styles.root}>
      <SyncSettingsSection draft={draft} update={update} />
      <ReadingSettingsSection draft={draft} update={update} />
      <DisplaySettingsSection draft={draft} update={update} />
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
