import { useEffect, useState } from 'react';
import type { SettingsFieldConfig } from '@tnet/ui/settings';
import {
  SettingsActions,
  SettingsDialogShell,
  SettingsFieldsSection,
  SettingsPrimaryButton,
  SettingsSecondaryButton
} from '@tnet/ui/settings';
import type { PdfViewerGlobalSettings } from '@tnet/app-pdf-viewer/shared/config';
import { defaultPdfViewerGlobalSettings } from '@tnet/app-pdf-viewer/shared/config';
import { pdfViewerTnetApi } from './pdfViewerTnetApi';
import { usePdfViewerDispatch, usePdfViewerSelector } from './state/storeHooks';
import { setPdfViewerError, setPdfViewerSettings } from './state/pdfViewerSlice';

interface PdfViewerSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPageProps {
  onClose: () => void;
}

export const PdfViewerSettingsDialog = ({
  isOpen,
  onClose
}: PdfViewerSettingsDialogProps): React.JSX.Element | null => (
  <SettingsDialogShell
    isOpen={isOpen}
    onClose={onClose}
    title="PDF Viewer Settings"
    ariaLabel="PDF Viewer settings"
  >
    <PdfViewerGlobalSettingsPage onClose={onClose} />
  </SettingsDialogShell>
);

export const PdfViewerGlobalSettingsPage = ({ onClose }: SettingsPageProps): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  const currentSettings = usePdfViewerSelector((state) => state.pdfViewer.settings);
  const [draft, setDraft] = useState<PdfViewerGlobalSettings>(currentSettings);

  useEffect(() => {
    let canceled = false;
    pdfViewerTnetApi.pdfViewer.config
      .loadGlobal()
      .then((settings) => {
        if (!canceled) setDraft(settings);
      })
      .catch((error: unknown) => {
        console.error('Failed to load PDF viewer settings', error);
        if (!canceled) setDraft(defaultPdfViewerGlobalSettings());
      });

    return () => {
      canceled = true;
    };
  }, []);

  const updateDraft = <Key extends keyof PdfViewerGlobalSettings>(
    key: Key,
    value: PdfViewerGlobalSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    await pdfViewerTnetApi.pdfViewer.config.saveGlobal(draft);
    dispatch(setPdfViewerSettings(draft));
    onClose();
  };

  return (
    <>
      <SettingsFieldsSection
        title="Defaults"
        draft={draft}
        fields={settingsFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save PDF viewer settings', error);
              dispatch(setPdfViewerError('Failed to save PDF viewer settings.'));
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

export const PdfViewerWorkspaceSettingsPage = ({
  onClose
}: SettingsPageProps): React.JSX.Element => (
  <>
    <p>PDF Viewer workspace settings are stored with each workspace session.</p>
    <SettingsActions>
      <SettingsPrimaryButton onClick={onClose}>Close</SettingsPrimaryButton>
    </SettingsActions>
  </>
);

const settingsFields: ReadonlyArray<SettingsFieldConfig<PdfViewerGlobalSettings>> = [
  {
    id: 'pdf-viewer-default-zoom',
    label: 'Default zoom',
    key: 'defaultZoomMode',
    type: 'select',
    options: [
      { label: 'Fit width', value: 'page-width' },
      { label: 'Fit page', value: 'page-fit' },
      { label: '100%', value: 'actual-size' },
      { label: 'Custom', value: 'custom' }
    ]
  },
  {
    id: 'pdf-viewer-default-scale',
    label: 'Default custom scale',
    key: 'defaultCustomScale',
    type: 'number',
    min: 0.1
  },
  {
    id: 'pdf-viewer-default-columns',
    label: 'Default columns',
    key: 'defaultColumns',
    type: 'number',
    min: 1
  },
  {
    id: 'pdf-viewer-overscan-pages',
    label: 'Overscan pages',
    key: 'overscanPages',
    type: 'number',
    min: 0
  }
];
