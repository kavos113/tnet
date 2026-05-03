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
import type {
  LlmSettings,
  MarkdownGlobalSettings,
  MarkdownSettings
} from '@tnet/app-markdown/shared/config';
import {
  defaultMarkdownGlobalSettings,
  getMarkdownGlobalSettings,
  withMarkdownGlobalSettings
} from '@tnet/app-markdown/shared/config';
import { setMarkdownGlobalSettings } from '../workspace/workspaceSlice';
import { markdownTnetApi } from '../markdownTnetApi';
import { useAppDispatch, useAppSelector } from '../storeHooks';
import { useProjectSettingsDraft } from './useProjectSettingsDraft';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPageProps {
  onClose: () => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose
}: SettingsDialogProps): React.JSX.Element | null => (
  <SettingsDialogShell
    isOpen={isOpen}
    onClose={onClose}
    title="Markdown Settings"
    ariaLabel="Markdown settings"
  >
    <MarkdownWorkspaceSettingsPage onClose={onClose} />
  </SettingsDialogShell>
);

export const MarkdownGlobalSettingsPage = ({ onClose }: SettingsPageProps): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const currentSettings = useAppSelector((state) => state.workspace.globalSettings);
  const [draft, setDraft] = useState<MarkdownGlobalSettings>(currentSettings);

  useEffect(() => {
    let canceled = false;
    markdownTnetApi.config
      .loadGlobal()
      .then((config) => {
        if (!canceled) setDraft(getMarkdownGlobalSettings(normalizeGlobalConfig(config)));
      })
      .catch((error: unknown) => {
        console.error('Failed to load markdown global settings', error);
        if (!canceled) setDraft(defaultMarkdownGlobalSettings());
      });

    return () => {
      canceled = true;
    };
  }, []);

  const updateDraft = <Key extends keyof MarkdownGlobalSettings>(
    key: Key,
    value: MarkdownGlobalSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    const config = normalizeGlobalConfig(await markdownTnetApi.config.loadGlobal());
    await markdownTnetApi.config.saveGlobal(withMarkdownGlobalSettings(config, draft));
    dispatch(setMarkdownGlobalSettings(draft));
    onClose();
  };

  return (
    <>
      <SettingsFieldsSection
        title="Editor Font"
        draft={draft}
        fields={globalEditorFontFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="Preview Font"
        draft={draft}
        fields={globalPreviewFontFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save markdown global settings', error);
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

export const MarkdownWorkspaceSettingsPage = ({
  onClose
}: SettingsPageProps): React.JSX.Element => {
  const { draft, updateMarkdownDraft, updateLlmDraft, saveSettings } =
    useProjectSettingsDraft(true);
  const { markdown, llm } = draft;

  return (
    <>
      <SettingsFieldsSection
        title="Auto Save"
        draft={markdown}
        fields={autoSaveFields}
        onFieldChange={updateMarkdownDraft}
      />
      <SettingsFieldsSection
        title="LLM Inline Completion"
        draft={llm}
        fields={llmFields}
        onFieldChange={updateLlmDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings()
              .then(onClose)
              .catch((error: unknown) => {
                console.error('Failed to save markdown workspace settings', error);
              });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

const globalEditorFontFields: ReadonlyArray<SettingsFieldConfig<MarkdownGlobalSettings>> = [
  {
    id: 'markdown-global-editor-font-family',
    label: 'Font family',
    key: 'editorFontFamily',
    type: 'text'
  },
  {
    id: 'markdown-global-editor-font-size',
    label: 'Font size (px)',
    key: 'editorFontSize',
    type: 'number',
    min: 8,
    max: 48
  }
];

const globalPreviewFontFields: ReadonlyArray<SettingsFieldConfig<MarkdownGlobalSettings>> = [
  {
    id: 'markdown-global-preview-font-family',
    label: 'Font family',
    key: 'previewFontFamily',
    type: 'text'
  },
  {
    id: 'markdown-global-preview-font-size',
    label: 'Font size (px)',
    key: 'previewFontSize',
    type: 'number',
    min: 8,
    max: 48
  }
];

const autoSaveFields: ReadonlyArray<SettingsFieldConfig<MarkdownSettings>> = [
  {
    id: 'auto-save-enabled',
    label: 'Enable auto save',
    key: 'autoSaveEnabled',
    type: 'checkbox'
  },
  {
    id: 'auto-save-debounce-ms',
    label: 'Debounce (ms)',
    key: 'autoSaveDebounceMs',
    type: 'number',
    min: 0,
    max: 30000
  }
];

const llmFields: ReadonlyArray<SettingsFieldConfig<LlmSettings>> = [
  {
    id: 'llm-inline-enabled',
    label: 'Enable inline completion',
    key: 'llmInlineCompletionEnabled',
    type: 'checkbox'
  },
  {
    id: 'llm-provider',
    label: 'Provider',
    key: 'llmProvider',
    type: 'select',
    options: [
      { value: 'mock', label: 'Mock' },
      { value: 'openai-sdk', label: 'OpenAI SDK' },
      { value: 'gemini-sdk', label: 'Gemini SDK' },
      { value: 'lm-studio', label: 'LM Studio' },
      { value: 'local-http', label: 'Local HTTP' },
      { value: 'openai-compatible', label: 'OpenAI Compatible' }
    ]
  },
  { id: 'llm-model', label: 'Model', key: 'llmModel', type: 'text' },
  { id: 'llm-endpoint', label: 'Endpoint', key: 'llmEndpoint', type: 'text' },
  { id: 'llm-api-key', label: 'API key', key: 'llmApiKey', type: 'password' },
  {
    id: 'llm-automatic-trigger',
    label: 'Automatic trigger',
    key: 'llmAutomaticTrigger',
    type: 'checkbox'
  },
  {
    id: 'llm-debounce-ms',
    label: 'Debounce (ms)',
    key: 'llmDebounceMs',
    type: 'number',
    min: 0,
    max: 5000
  },
  {
    id: 'llm-request-timeout-ms',
    label: 'Request timeout (ms)',
    key: 'llmRequestTimeoutMs',
    type: 'number',
    min: 1000,
    max: 300000
  },
  {
    id: 'llm-max-prefix-chars',
    label: 'Max prefix chars',
    key: 'llmMaxPrefixChars',
    type: 'number',
    min: 100,
    max: 50000
  },
  {
    id: 'llm-max-suffix-chars',
    label: 'Max suffix chars',
    key: 'llmMaxSuffixChars',
    type: 'number',
    min: 0,
    max: 20000
  }
];
