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
import type { TasksGlobalSettings } from '@tnet/app-tasks/shared/config';
import {
  defaultTasksGlobalSettings,
  getTasksGlobalSettings,
  normalizeTasksGlobalSettings,
  withTasksGlobalSettings
} from '@tnet/app-tasks/shared/config';
import { setTasksError, setTasksSettings } from '../tasksSlice';
import { useTasksDispatch, useTasksSelector } from '../storeHooks';
import { TasksSourceSettings } from './TasksSourceSettings';

interface TasksSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPageProps {
  onClose: () => void;
}

export const TasksSettingsDialog = ({
  isOpen,
  onClose
}: TasksSettingsDialogProps): React.JSX.Element | null => (
  <SettingsDialogShell
    isOpen={isOpen}
    onClose={onClose}
    title="Tasks Settings"
    ariaLabel="Tasks settings"
  >
    <TasksGlobalSettingsPage onClose={onClose} />
  </SettingsDialogShell>
);

export const TasksGlobalSettingsPage = ({ onClose }: SettingsPageProps): React.JSX.Element => {
  const dispatch = useTasksDispatch();
  const currentSettings = useTasksSelector((state) => state.tasks.settings);
  const [draft, setDraft] = useState<TasksGlobalSettings>(currentSettings);

  useEffect(() => {
    let canceled = false;
    tnetApi.config
      .loadGlobal()
      .then((config) => {
        if (!canceled) setDraft(getTasksGlobalSettings(normalizeGlobalConfig(config)));
      })
      .catch((error: unknown) => {
        console.error('Failed to load tasks global settings', error);
        if (!canceled) setDraft(defaultTasksGlobalSettings());
      });

    return () => {
      canceled = true;
    };
  }, []);

  const updateDraft = <Key extends keyof TasksGlobalSettings>(
    key: Key,
    value: TasksGlobalSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    const normalizedDraft = normalizeTasksGlobalSettings(draft);
    const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
    await tnetApi.config.saveGlobal(withTasksGlobalSettings(config, normalizedDraft));
    dispatch(setTasksSettings(normalizedDraft));
    onClose();
  };

  return (
    <>
      <SettingsFieldsSection
        title="Calendar"
        draft={draft}
        fields={calendarFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="Sync"
        draft={draft}
        fields={syncFields}
        onFieldChange={updateDraft}
      />
      <TasksSourceSettings />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save tasks global settings', error);
              dispatch(setTasksError('Failed to save tasks global settings.'));
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

const calendarFields: ReadonlyArray<SettingsFieldConfig<TasksGlobalSettings>> = [
  {
    id: 'tasks-week-starts-on',
    label: 'Week starts on',
    key: 'weekStartsOn',
    type: 'select',
    options: [
      { value: '0', label: 'Sunday' },
      { value: '1', label: 'Monday' },
      { value: '2', label: 'Tuesday' },
      { value: '3', label: 'Wednesday' },
      { value: '4', label: 'Thursday' },
      { value: '5', label: 'Friday' },
      { value: '6', label: 'Saturday' }
    ]
  },
  {
    id: 'tasks-time-format',
    label: 'Time format',
    key: 'timeFormat',
    type: 'select',
    options: [
      { value: '24h', label: '24 hour' },
      { value: '12h', label: '12 hour' }
    ]
  },
  {
    id: 'tasks-default-view',
    label: 'Default view',
    key: 'defaultView',
    type: 'select',
    options: [
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' }
    ]
  },
  {
    id: 'tasks-clock-size',
    label: 'Clock size',
    key: 'clockSize',
    type: 'select',
    options: [
      { value: 'large', label: 'Large' },
      { value: 'compact', label: 'Compact' }
    ]
  },
  {
    id: 'tasks-show-portal',
    label: 'Show portal shortcuts',
    key: 'showPortal',
    type: 'checkbox'
  },
  {
    id: 'tasks-category-completion-enabled',
    label: 'Use category suggestions',
    key: 'categoryCompletionEnabled',
    type: 'checkbox'
  }
];

const syncFields: ReadonlyArray<SettingsFieldConfig<TasksGlobalSettings>> = [
  {
    id: 'tasks-sync-interval',
    label: 'Sync interval (minutes)',
    key: 'syncIntervalMinutes',
    type: 'number',
    min: 5,
    max: 1440,
    step: 5
  }
];
