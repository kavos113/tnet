import { useEffect, useState } from 'react';
import type { SettingsFieldConfig } from '@tnet/ui/settings';
import { SettingsDialogShell, SettingsFieldsSection } from '@tnet/ui/settings';
import type { PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import {
  defaultPapersLibraryConfig,
  normalizePapersLibraryConfig
} from '@tnet/app-papers/shared/config';
import { setPapersLibrarySettings } from '../library/librarySlice';
import { papersTnetApi } from '../papersTnetApi';
import { usePapersDispatch, usePapersSelector } from '../storeHooks';

interface PapersSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PapersSettingsDialog = ({
  isOpen,
  onClose
}: PapersSettingsDialogProps): React.JSX.Element | null => {
  const dispatch = usePapersDispatch();
  const activeLibraryRoot = usePapersSelector((state) => state.papersLibrary.activeLibraryRoot);
  const settings = usePapersSelector((state) => state.papersLibrary.settings);
  const [draft, setDraft] = useState<PapersLibraryConfig>(settings);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [activeLibraryRoot, isOpen, settings]);

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
  };

  return (
    <SettingsDialogShell
      isOpen={isOpen}
      onClose={onClose}
      title="Papers Settings"
      ariaLabel="Papers settings"
      unavailableMessage={
        !activeLibraryRoot ? 'Open a paper library before editing settings.' : undefined
      }
      isSaveDisabled={!activeLibraryRoot}
      onSave={saveSettings}
      onSaveError={(error) => {
        console.error('Failed to save paper settings', error);
      }}
    >
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
    </SettingsDialogShell>
  );
};

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
  },
  {
    id: 'papers-note-editor-font-family',
    label: 'Editor font family',
    key: 'noteEditorFontFamily',
    type: 'text'
  },
  {
    id: 'papers-note-editor-font-size',
    label: 'Editor font size (px)',
    key: 'noteEditorFontSize',
    type: 'number',
    min: 10,
    max: 32
  },
  {
    id: 'papers-note-preview-font-family',
    label: 'Preview font family',
    key: 'notePreviewFontFamily',
    type: 'text'
  },
  {
    id: 'papers-note-preview-font-size',
    label: 'Preview font size (px)',
    key: 'notePreviewFontSize',
    type: 'number',
    min: 10,
    max: 32
  }
];
