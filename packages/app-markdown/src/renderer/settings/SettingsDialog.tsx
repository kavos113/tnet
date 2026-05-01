import type { SettingsFieldConfig } from '@tnet/ui/settings';
import { SettingsDialogShell, SettingsFieldsSection } from '@tnet/ui/settings';
import type { LlmSettings, MarkdownSettings } from '@tnet/app-markdown/shared/config';
import { useProjectSettingsDraft } from './useProjectSettingsDraft';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose
}: SettingsDialogProps): React.JSX.Element | null => {
  const { draft, updateMarkdownDraft, updateLlmDraft, saveSettings } =
    useProjectSettingsDraft(isOpen);
  const { markdown, llm } = draft;

  return (
    <SettingsDialogShell
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      ariaLabel="Settings"
      onSave={saveSettings}
      onSaveError={(error) => {
        console.error('Failed to save settings', error);
      }}
    >
      <SettingsFieldsSection
        title="Editor Font"
        draft={markdown}
        fields={editorFontFields}
        onFieldChange={updateMarkdownDraft}
      />
      <SettingsFieldsSection
        title="Preview Font"
        draft={markdown}
        fields={previewFontFields}
        onFieldChange={updateMarkdownDraft}
      />
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
    </SettingsDialogShell>
  );
};

const editorFontFields: ReadonlyArray<SettingsFieldConfig<MarkdownSettings>> = [
  { id: 'editor-font-family', label: 'Font family', key: 'editorFontFamily', type: 'text' },
  {
    id: 'editor-font-size',
    label: 'Font size (px)',
    key: 'editorFontSize',
    type: 'number',
    min: 8,
    max: 48
  }
];

const previewFontFields: ReadonlyArray<SettingsFieldConfig<MarkdownSettings>> = [
  { id: 'preview-font-family', label: 'Font family', key: 'previewFontFamily', type: 'text' },
  {
    id: 'preview-font-size',
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
