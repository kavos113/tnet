import { useEffect, useState } from 'react';
import type { SettingsFieldConfig } from '@tnet/ui/settings';
import {
  SettingsActions,
  SettingsDialogShell,
  SettingsFieldsSection,
  SettingsPrimaryButton,
  SettingsSecondaryButton
} from '@tnet/ui/settings';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { tnetApi } from '@tnet/renderer-core/tnetApi';
import type {
  DbInspectorGlobalSettings,
  DbInspectorWorkspaceSettings
} from '@tnet/app-db-inspector/shared/config';
import {
  defaultDbInspectorGlobalSettings,
  getDbInspectorGlobalSettings,
  normalizeDbInspectorWorkspaceSettings,
  withDbInspectorGlobalSettings
} from '@tnet/app-db-inspector/shared/config';
import {
  setDbInspectorError,
  setDbInspectorGlobalSettings,
  setDbInspectorSettings
} from '../dbInspectorSlice';
import { dbInspectorTnetApi } from '../dbInspectorTnetApi';
import { useDbInspectorDispatch, useDbInspectorSelector } from '../storeHooks';

interface DbInspectorSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPageProps {
  onClose: () => void;
}

export const DbInspectorSettingsDialog = ({
  isOpen,
  onClose
}: DbInspectorSettingsDialogProps): React.JSX.Element | null => (
  <SettingsDialogShell
    isOpen={isOpen}
    onClose={onClose}
    title="DB Inspector Settings"
    ariaLabel="DB Inspector settings"
  >
    <DbInspectorWorkspaceSettingsPage onClose={onClose} />
  </SettingsDialogShell>
);

export const DbInspectorGlobalSettingsPage = ({
  onClose
}: SettingsPageProps): React.JSX.Element => {
  const dispatch = useDbInspectorDispatch();
  const currentSettings = useDbInspectorSelector((state) => state.dbInspector.globalSettings);
  const [draft, setDraft] = useState<DbInspectorGlobalSettings>(currentSettings);

  useEffect(() => {
    let canceled = false;
    tnetApi.config
      .loadGlobal()
      .then((config) => {
        if (!canceled) setDraft(getDbInspectorGlobalSettings(normalizeGlobalConfig(config)));
      })
      .catch((error: unknown) => {
        console.error('Failed to load DB Inspector global settings', error);
        if (!canceled) setDraft(defaultDbInspectorGlobalSettings());
      });

    return () => {
      canceled = true;
    };
  }, []);

  const updateDraft = <Key extends keyof DbInspectorGlobalSettings>(
    key: Key,
    value: DbInspectorGlobalSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
    await tnetApi.config.saveGlobal(withDbInspectorGlobalSettings(config, draft));
    dispatch(setDbInspectorGlobalSettings(draft));
    onClose();
  };

  return (
    <>
      <SettingsFieldsSection
        title="Display"
        draft={draft}
        fields={globalFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save DB Inspector global settings', error);
              dispatch(setDbInspectorError('Failed to save DB Inspector global settings.'));
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

export const DbInspectorWorkspaceSettingsPage = ({
  onClose
}: SettingsPageProps): React.JSX.Element => {
  const dispatch = useDbInspectorDispatch();
  const activeWorkspaceId = useDbInspectorSelector((state) => state.dbInspector.activeWorkspaceId);
  const settings = useDbInspectorSelector((state) => state.dbInspector.settings);
  const [draft, setDraft] = useState<DbInspectorWorkspaceSettings>(settings);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setDraft(settings);
      return;
    }

    let canceled = false;
    dbInspectorTnetApi.dbInspector.workspaces
      .getSettings({ workspaceId: activeWorkspaceId })
      .then((loadedSettings) => {
        if (!canceled) setDraft(loadedSettings);
      })
      .catch((error: unknown) => {
        console.error('Failed to load DB Inspector workspace settings', error);
        if (!canceled) setDraft(settings);
      });

    return () => {
      canceled = true;
    };
  }, [activeWorkspaceId, settings]);

  const updateDraft = <Key extends keyof DbInspectorWorkspaceSettings>(
    key: Key,
    value: DbInspectorWorkspaceSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    if (!activeWorkspaceId) return;
    const normalizedDraft = normalizeDbInspectorWorkspaceSettings(draft);
    await dbInspectorTnetApi.dbInspector.workspaces.saveSettings({
      workspaceId: activeWorkspaceId,
      settings: normalizedDraft
    });
    dispatch(setDbInspectorSettings(normalizedDraft));
    onClose();
  };

  if (!activeWorkspaceId) {
    return <p>Create a DB workspace before editing settings.</p>;
  }

  return (
    <>
      <SettingsFieldsSection
        title="Workspace"
        draft={draft}
        fields={workspaceFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save DB Inspector workspace settings', error);
              dispatch(setDbInspectorError('Failed to save DB Inspector workspace settings.'));
            });
          }}
        >
          Save Settings
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

const globalFields: ReadonlyArray<SettingsFieldConfig<DbInspectorGlobalSettings>> = [
  {
    id: 'db-inspector-default-page-size',
    label: 'Default page size',
    key: 'defaultPageSize',
    type: 'number',
    min: 1,
    step: 10
  }
];

const workspaceFields: ReadonlyArray<SettingsFieldConfig<DbInspectorWorkspaceSettings>> = [
  {
    id: 'db-inspector-default-schema',
    label: 'Default schema',
    key: 'defaultSchema',
    type: 'text'
  },
  {
    id: 'db-inspector-table-page-size',
    label: 'Table page size',
    key: 'tablePageSize',
    type: 'number',
    min: 1,
    step: 10
  },
  {
    id: 'db-inspector-query-timeout-ms',
    label: 'Query timeout (ms)',
    key: 'queryTimeoutMs',
    type: 'number',
    min: 1,
    step: 1000
  },
  {
    id: 'db-inspector-read-only-mode',
    label: 'Read-only mode',
    key: 'readOnlyMode',
    type: 'checkbox'
  },
  {
    id: 'db-inspector-auto-refresh-schema',
    label: 'Auto refresh schema',
    key: 'autoRefreshSchema',
    type: 'checkbox'
  },
  {
    id: 'db-inspector-show-system-schemas',
    label: 'Show system schemas',
    key: 'showSystemSchemas',
    type: 'checkbox'
  }
];
