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
import type { PapersGlobalSettings, PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import {
  defaultPapersGlobalSettings,
  defaultPapersLibraryConfig,
  getPapersGlobalSettings,
  normalizePapersLibraryConfig,
  withPapersGlobalSettings
} from '@tnet/app-papers/shared/config';
import { setPapersGlobalSettings, setPapersLibrarySettings } from '../library/librarySlice';
import { papersTnetApi } from '../papersTnetApi';
import { usePapersDispatch, usePapersSelector } from '../storeHooks';

interface PapersSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPageProps {
  onClose: () => void;
}

export const PapersSettingsDialog = ({
  isOpen,
  onClose
}: PapersSettingsDialogProps): React.JSX.Element | null => (
  <SettingsDialogShell
    isOpen={isOpen}
    onClose={onClose}
    title="Papers Settings"
    ariaLabel="Papers settings"
  >
    <PapersWorkspaceSettingsPage onClose={onClose} />
  </SettingsDialogShell>
);

export const PapersGlobalSettingsPage = ({ onClose }: SettingsPageProps): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const currentSettings = usePapersSelector((state) => state.papersLibrary.globalSettings);
  const [draft, setDraft] = useState<PapersGlobalSettings>(currentSettings);

  useEffect(() => {
    let canceled = false;
    papersTnetApi.config
      .loadGlobal()
      .then((config) => {
        if (!canceled) setDraft(getPapersGlobalSettings(normalizeGlobalConfig(config)));
      })
      .catch((error: unknown) => {
        console.error('Failed to load papers global settings', error);
        if (!canceled) setDraft(defaultPapersGlobalSettings());
      });

    return () => {
      canceled = true;
    };
  }, []);

  const updateDraft = <Key extends keyof PapersGlobalSettings>(
    key: Key,
    value: PapersGlobalSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    const config = normalizeGlobalConfig(await papersTnetApi.config.loadGlobal());
    await papersTnetApi.config.saveGlobal(withPapersGlobalSettings(config, draft));
    dispatch(setPapersGlobalSettings(draft));
    onClose();
  };

  return (
    <>
      <SettingsFieldsSection
        title="Note Editor Font"
        draft={draft}
        fields={globalNoteEditorFontFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="Note Preview Font"
        draft={draft}
        fields={globalNotePreviewFontFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="AI"
        draft={draft}
        fields={globalAiFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save papers global settings', error);
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

export const PapersWorkspaceSettingsPage = ({ onClose }: SettingsPageProps): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const activeLibraryRoot = usePapersSelector((state) => state.papersLibrary.activeLibraryRoot);
  const settings = usePapersSelector((state) => state.papersLibrary.settings);
  const [draft, setDraft] = useState<PapersLibraryConfig>(settings);

  useEffect(() => {
    if (!activeLibraryRoot) {
      setDraft(defaultPapersLibraryConfig());
      return;
    }

    let canceled = false;
    papersTnetApi.papers.config
      .loadLibrary(activeLibraryRoot)
      .then((loadedSettings) => {
        if (!canceled) setDraft(normalizePapersLibraryConfig(loadedSettings));
      })
      .catch((error: unknown) => {
        console.error('Failed to load paper settings', error);
        if (!canceled) setDraft(settings);
      });

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, settings]);

  const updateDraft = <Key extends keyof PapersLibraryConfig>(
    key: Key,
    value: PapersLibraryConfig[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    if (!activeLibraryRoot) return;
    await papersTnetApi.papers.config.saveLibrary(activeLibraryRoot, draft);
    dispatch(setPapersLibrarySettings(draft));
    onClose();
  };

  if (!activeLibraryRoot) {
    return <p>Open a paper library before editing settings.</p>;
  }

  return (
    <>
      <SettingsFieldsSection
        title="List"
        draft={draft}
        fields={listFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="PDF"
        draft={draft}
        fields={pdfFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="Notes"
        draft={draft}
        fields={noteFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save paper settings', error);
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

const globalNoteEditorFontFields: ReadonlyArray<SettingsFieldConfig<PapersGlobalSettings>> = [
  {
    id: 'papers-global-note-editor-font-family',
    label: 'Editor font family',
    key: 'noteEditorFontFamily',
    type: 'text'
  },
  {
    id: 'papers-global-note-editor-font-size',
    label: 'Editor font size (px)',
    key: 'noteEditorFontSize',
    type: 'number',
    min: 10,
    max: 32
  }
];

const globalNotePreviewFontFields: ReadonlyArray<SettingsFieldConfig<PapersGlobalSettings>> = [
  {
    id: 'papers-global-note-preview-font-family',
    label: 'Preview font family',
    key: 'notePreviewFontFamily',
    type: 'text'
  },
  {
    id: 'papers-global-note-preview-font-size',
    label: 'Preview font size (px)',
    key: 'notePreviewFontSize',
    type: 'number',
    min: 10,
    max: 32
  }
];

const globalAiFields: ReadonlyArray<SettingsFieldConfig<PapersGlobalSettings>> = [
  {
    id: 'papers-ai-provider',
    label: 'Provider',
    key: 'aiProvider',
    type: 'select',
    options: [
      { value: 'mock', label: 'Mock' },
      { value: 'openai-sdk', label: 'OpenAI SDK' },
      { value: 'gemini-sdk', label: 'Gemini SDK' }
    ]
  },
  { id: 'papers-ai-model', label: 'Model', key: 'aiModel', type: 'text' },
  { id: 'papers-ai-endpoint', label: 'Endpoint', key: 'aiEndpoint', type: 'text' },
  { id: 'papers-ai-api-key', label: 'API key', key: 'aiApiKey', type: 'password' },
  {
    id: 'papers-ai-default-target-language',
    label: 'Default target language',
    key: 'aiDefaultTargetLanguage',
    type: 'text'
  },
  {
    id: 'papers-ai-timeout-ms',
    label: 'Timeout ms',
    key: 'aiTimeoutMs',
    type: 'number',
    min: 1000,
    step: 1000
  },
  {
    id: 'papers-ai-text-chunk-chars',
    label: 'Text chunk chars',
    key: 'aiTextChunkChars',
    type: 'number',
    min: 1000,
    step: 1000
  },
  {
    id: 'papers-ai-max-output-tokens',
    label: 'Max output tokens',
    key: 'aiMaxOutputTokens',
    type: 'number',
    min: 256,
    step: 256
  }
];

const listFields: ReadonlyArray<SettingsFieldConfig<PapersLibraryConfig>> = [
  {
    id: 'papers-list-density',
    label: 'Density',
    key: 'listDensity',
    type: 'select',
    options: [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'compact', label: 'Compact' }
    ]
  }
];

const pdfFields: ReadonlyArray<SettingsFieldConfig<PapersLibraryConfig>> = [
  {
    id: 'papers-pdf-zoom',
    label: 'Default zoom',
    key: 'pdfZoomMode',
    type: 'select',
    options: [
      { value: 'page-width', label: 'Fit width' },
      { value: 'page-fit', label: 'Fit page' },
      { value: 'actual-size', label: '100%' }
    ]
  }
];

const noteFields: ReadonlyArray<SettingsFieldConfig<PapersLibraryConfig>> = [
  {
    id: 'papers-note-mode',
    label: 'Mode',
    key: 'noteEditorMode',
    type: 'select',
    options: [
      { value: 'editor', label: 'Editor' },
      { value: 'preview', label: 'Preview' },
      { value: 'split', label: 'Split' }
    ]
  },
  {
    id: 'papers-note-debounce',
    label: 'Auto save delay (ms)',
    key: 'noteAutoSaveDebounceMs',
    type: 'number',
    min: 100,
    step: 100
  }
];
