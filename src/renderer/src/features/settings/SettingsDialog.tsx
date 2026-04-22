import type { LlmProviderType } from '@shared/types/config';
import { useProjectSettingsDraft } from './useProjectSettingsDraft';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({
  isOpen,
  onClose
}: SettingsDialogProps): React.JSX.Element | null => {
  const { draft, updateDraft, saveSettings } = useProjectSettingsDraft(isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className="modal-content"
        aria-label="Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Settings</h2>

        <div className="settings-group">
          <h3>Editor Font</h3>
          <label className="form-item" htmlFor="editor-font-family">
            <span>Font family</span>
            <input
              id="editor-font-family"
              value={draft.editorFontFamily}
              onChange={(event) => updateDraft('editorFontFamily', event.target.value)}
            />
          </label>
          <label className="form-item" htmlFor="editor-font-size">
            <span>Font size (px)</span>
            <input
              id="editor-font-size"
              type="number"
              min={8}
              max={48}
              value={draft.editorFontSize}
              onChange={(event) => updateDraft('editorFontSize', Number(event.target.value))}
            />
          </label>
        </div>

        <div className="settings-group">
          <h3>Preview Font</h3>
          <label className="form-item" htmlFor="preview-font-family">
            <span>Font family</span>
            <input
              id="preview-font-family"
              value={draft.previewFontFamily}
              onChange={(event) => updateDraft('previewFontFamily', event.target.value)}
            />
          </label>
          <label className="form-item" htmlFor="preview-font-size">
            <span>Font size (px)</span>
            <input
              id="preview-font-size"
              type="number"
              min={8}
              max={48}
              value={draft.previewFontSize}
              onChange={(event) => updateDraft('previewFontSize', Number(event.target.value))}
            />
          </label>
        </div>

        <div className="settings-group">
          <h3>LLM Inline Completion</h3>
          <label className="form-item form-item-inline" htmlFor="llm-inline-enabled">
            <span>Enable inline completion</span>
            <input
              id="llm-inline-enabled"
              type="checkbox"
              checked={draft.llmInlineCompletionEnabled}
              onChange={(event) => updateDraft('llmInlineCompletionEnabled', event.target.checked)}
            />
          </label>
          <label className="form-item" htmlFor="llm-provider">
            <span>Provider</span>
            <select
              id="llm-provider"
              value={draft.llmProvider}
              onChange={(event) =>
                updateDraft('llmProvider', event.target.value as LlmProviderType)
              }
            >
              <option value="mock">Mock</option>
              <option value="local-http">Local HTTP</option>
              <option value="openai-compatible">OpenAI Compatible</option>
            </select>
          </label>
          <label className="form-item" htmlFor="llm-model">
            <span>Model</span>
            <input
              id="llm-model"
              value={draft.llmModel}
              onChange={(event) => updateDraft('llmModel', event.target.value)}
            />
          </label>
          <label className="form-item" htmlFor="llm-endpoint">
            <span>Endpoint</span>
            <input
              id="llm-endpoint"
              value={draft.llmEndpoint}
              onChange={(event) => updateDraft('llmEndpoint', event.target.value)}
            />
          </label>
          <label className="form-item" htmlFor="llm-api-key">
            <span>API key</span>
            <input
              id="llm-api-key"
              type="password"
              value={draft.llmApiKey}
              onChange={(event) => updateDraft('llmApiKey', event.target.value)}
            />
          </label>
          <label className="form-item form-item-inline" htmlFor="llm-automatic-trigger">
            <span>Automatic trigger</span>
            <input
              id="llm-automatic-trigger"
              type="checkbox"
              checked={draft.llmAutomaticTrigger}
              onChange={(event) => updateDraft('llmAutomaticTrigger', event.target.checked)}
            />
          </label>
          <label className="form-item" htmlFor="llm-debounce-ms">
            <span>Debounce (ms)</span>
            <input
              id="llm-debounce-ms"
              type="number"
              min={0}
              max={5000}
              value={draft.llmDebounceMs}
              onChange={(event) => updateDraft('llmDebounceMs', Number(event.target.value))}
            />
          </label>
          <label className="form-item" htmlFor="llm-max-prefix-chars">
            <span>Max prefix chars</span>
            <input
              id="llm-max-prefix-chars"
              type="number"
              min={100}
              max={50000}
              value={draft.llmMaxPrefixChars}
              onChange={(event) => updateDraft('llmMaxPrefixChars', Number(event.target.value))}
            />
          </label>
          <label className="form-item" htmlFor="llm-max-suffix-chars">
            <span>Max suffix chars</span>
            <input
              id="llm-max-suffix-chars"
              type="number"
              min={0}
              max={20000}
              value={draft.llmMaxSuffixChars}
              onChange={(event) => updateDraft('llmMaxSuffixChars', Number(event.target.value))}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              saveSettings()
                .then(onClose)
                .catch((error: unknown) => {
                  console.error('Failed to save settings', error);
                });
            }}
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
};
