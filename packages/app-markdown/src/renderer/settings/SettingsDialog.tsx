import type { LlmProviderType } from '@tnet/app-markdown/shared/config';
import { useProjectSettingsDraft } from './useProjectSettingsDraft';
import styles from './SettingsDialog.module.css';

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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <section
        className={styles.content}
        aria-label="Settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Settings</h2>

        <div className={styles.group}>
          <h3>Editor Font</h3>
          <label className={styles.formItem} htmlFor="editor-font-family">
            <span>Font family</span>
            <input
              id="editor-font-family"
              value={markdown.editorFontFamily}
              onChange={(event) => updateMarkdownDraft('editorFontFamily', event.target.value)}
            />
          </label>
          <label className={styles.formItem} htmlFor="editor-font-size">
            <span>Font size (px)</span>
            <input
              id="editor-font-size"
              type="number"
              min={8}
              max={48}
              value={markdown.editorFontSize}
              onChange={(event) =>
                updateMarkdownDraft('editorFontSize', Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className={styles.group}>
          <h3>Preview Font</h3>
          <label className={styles.formItem} htmlFor="preview-font-family">
            <span>Font family</span>
            <input
              id="preview-font-family"
              value={markdown.previewFontFamily}
              onChange={(event) => updateMarkdownDraft('previewFontFamily', event.target.value)}
            />
          </label>
          <label className={styles.formItem} htmlFor="preview-font-size">
            <span>Font size (px)</span>
            <input
              id="preview-font-size"
              type="number"
              min={8}
              max={48}
              value={markdown.previewFontSize}
              onChange={(event) =>
                updateMarkdownDraft('previewFontSize', Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className={styles.group}>
          <h3>Auto Save</h3>
          <label
            className={`${styles.formItem} ${styles.formItemInline}`}
            htmlFor="auto-save-enabled"
          >
            <span>Enable auto save</span>
            <input
              id="auto-save-enabled"
              type="checkbox"
              checked={markdown.autoSaveEnabled}
              onChange={(event) => updateMarkdownDraft('autoSaveEnabled', event.target.checked)}
            />
          </label>
          <label className={styles.formItem} htmlFor="auto-save-debounce-ms">
            <span>Debounce (ms)</span>
            <input
              id="auto-save-debounce-ms"
              type="number"
              min={0}
              max={30000}
              value={markdown.autoSaveDebounceMs}
              onChange={(event) =>
                updateMarkdownDraft('autoSaveDebounceMs', Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className={styles.group}>
          <h3>LLM Inline Completion</h3>
          <label
            className={`${styles.formItem} ${styles.formItemInline}`}
            htmlFor="llm-inline-enabled"
          >
            <span>Enable inline completion</span>
            <input
              id="llm-inline-enabled"
              type="checkbox"
              checked={llm.llmInlineCompletionEnabled}
              onChange={(event) =>
                updateLlmDraft('llmInlineCompletionEnabled', event.target.checked)
              }
            />
          </label>
          <label className={styles.formItem} htmlFor="llm-provider">
            <span>Provider</span>
            <select
              id="llm-provider"
              value={llm.llmProvider}
              onChange={(event) =>
                updateLlmDraft('llmProvider', event.target.value as LlmProviderType)
              }
            >
              <option value="mock">Mock</option>
              <option value="openai-sdk">OpenAI SDK</option>
              <option value="gemini-sdk">Gemini SDK</option>
              <option value="lm-studio">LM Studio</option>
              <option value="local-http">Local HTTP</option>
              <option value="openai-compatible">OpenAI Compatible</option>
            </select>
          </label>
          <label className={styles.formItem} htmlFor="llm-model">
            <span>Model</span>
            <input
              id="llm-model"
              value={llm.llmModel}
              onChange={(event) => updateLlmDraft('llmModel', event.target.value)}
            />
          </label>
          <label className={styles.formItem} htmlFor="llm-endpoint">
            <span>Endpoint</span>
            <input
              id="llm-endpoint"
              value={llm.llmEndpoint}
              onChange={(event) => updateLlmDraft('llmEndpoint', event.target.value)}
            />
          </label>
          <label className={styles.formItem} htmlFor="llm-api-key">
            <span>API key</span>
            <input
              id="llm-api-key"
              type="password"
              value={llm.llmApiKey}
              onChange={(event) => updateLlmDraft('llmApiKey', event.target.value)}
            />
          </label>
          <label
            className={`${styles.formItem} ${styles.formItemInline}`}
            htmlFor="llm-automatic-trigger"
          >
            <span>Automatic trigger</span>
            <input
              id="llm-automatic-trigger"
              type="checkbox"
              checked={llm.llmAutomaticTrigger}
              onChange={(event) => updateLlmDraft('llmAutomaticTrigger', event.target.checked)}
            />
          </label>
          <label className={styles.formItem} htmlFor="llm-debounce-ms">
            <span>Debounce (ms)</span>
            <input
              id="llm-debounce-ms"
              type="number"
              min={0}
              max={5000}
              value={llm.llmDebounceMs}
              onChange={(event) => updateLlmDraft('llmDebounceMs', Number(event.target.value))}
            />
          </label>
          <label className={styles.formItem} htmlFor="llm-max-prefix-chars">
            <span>Max prefix chars</span>
            <input
              id="llm-max-prefix-chars"
              type="number"
              min={100}
              max={50000}
              value={llm.llmMaxPrefixChars}
              onChange={(event) => updateLlmDraft('llmMaxPrefixChars', Number(event.target.value))}
            />
          </label>
          <label className={styles.formItem} htmlFor="llm-max-suffix-chars">
            <span>Max suffix chars</span>
            <input
              id="llm-max-suffix-chars"
              type="number"
              min={0}
              max={20000}
              value={llm.llmMaxSuffixChars}
              onChange={(event) => updateLlmDraft('llmMaxSuffixChars', Number(event.target.value))}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryButton}
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
