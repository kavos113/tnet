import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { AppId } from '@tnet/shared/app/appTypes';
import {
  SettingsActions,
  SettingsCenterDialog,
  SettingsFieldsSection,
  SettingsPrimaryButton,
  SettingsSecondaryButton,
  type SettingsCenterPage,
  type SettingsFieldConfig
} from '@tnet/ui/settings';
import {
  defaultGlobalFontSettings,
  getGlobalFontSettings,
  normalizeGlobalConfig,
  withGlobalFontSettings,
  type GlobalFontSettings
} from '@tnet/shared/types/config';
import { tnetApi } from '@tnet/renderer-core/tnetApi';
import { useAppSelector } from './hooks';

const TasksGlobalSettingsPage = lazy(() =>
  import('@tnet/app-tasks/renderer').then((module) => ({
    default: module.TasksGlobalSettingsPage
  }))
);
const MarkdownWorkspaceSettingsPage = lazy(() =>
  import('@tnet/app-markdown/renderer').then((module) => ({
    default: module.MarkdownWorkspaceSettingsPage
  }))
);
const PapersGlobalSettingsPage = lazy(() =>
  import('@tnet/app-papers/renderer').then((module) => ({
    default: module.PapersGlobalSettingsPage
  }))
);
const PapersWorkspaceSettingsPage = lazy(() =>
  import('@tnet/app-papers/renderer').then((module) => ({
    default: module.PapersWorkspaceSettingsPage
  }))
);
const RequesterWorkspaceSettingsPage = lazy(() =>
  import('@tnet/app-requester/renderer').then((module) => ({
    default: module.RequesterWorkspaceSettingsPage
  }))
);
const RssGlobalSettingsPage = lazy(() =>
  import('@tnet/app-rss/renderer').then((module) => ({
    default: module.RssGlobalSettingsPage
  }))
);
const DbInspectorGlobalSettingsPage = lazy(() =>
  import('@tnet/app-db-inspector/renderer').then((module) => ({
    default: module.DbInspectorGlobalSettingsPage
  }))
);
const DbInspectorWorkspaceSettingsPage = lazy(() =>
  import('@tnet/app-db-inspector/renderer').then((module) => ({
    default: module.DbInspectorWorkspaceSettingsPage
  }))
);
const PdfViewerGlobalSettingsPage = lazy(() =>
  import('@tnet/app-pdf-viewer/renderer').then((module) => ({
    default: module.PdfViewerGlobalSettingsPage
  }))
);
const PdfViewerWorkspaceSettingsPage = lazy(() =>
  import('@tnet/app-pdf-viewer/renderer').then((module) => ({
    default: module.PdfViewerWorkspaceSettingsPage
  }))
);

interface AppSettingsCenterProps {
  isOpen: boolean;
  activeAppId: AppId;
  onClose: () => void;
  onFontSettingsChange: (settings: GlobalFontSettings) => void;
}

export const AppSettingsCenter = ({
  isOpen,
  activeAppId,
  onClose,
  onFontSettingsChange
}: AppSettingsCenterProps): React.JSX.Element => {
  const markdownRootPath = useAppSelector((state) => state.workspace.rootPath);
  const papersLibraryRoot = useAppSelector((state) => state.papersLibrary.activeLibraryRoot);
  const requesterWorkspaceId = useAppSelector((state) => state.requester.activeWorkspaceId);
  const dbInspectorWorkspaceId = useAppSelector((state) => state.dbInspector.activeWorkspaceId);
  const pdfViewerRootPath = useAppSelector((state) => state.pdfViewer.rootPath);
  const [activePageId, setActivePageId] = useState(() => getInitialPageId(activeAppId, true));

  const pages = useMemo<SettingsCenterPage[]>(
    () => [
      {
        id: 'tnet-fonts',
        appId: 'tnet',
        appLabel: 'TNET',
        appIcon: 'settings',
        scopeLabel: 'Fonts',
        title: 'TNET Fonts',
        content: (
          <GlobalFontSettingsPage onClose={onClose} onFontSettingsChange={onFontSettingsChange} />
        )
      },
      {
        id: 'tasks-global',
        appId: 'tasks',
        appLabel: 'Tasks',
        appIcon: 'task_alt',
        scopeLabel: 'Global',
        title: 'Tasks Global',
        content: lazyContent(<TasksGlobalSettingsPage onClose={onClose} />)
      },
      {
        id: 'markdown-workspace',
        appId: 'markdown',
        appLabel: 'Markdown',
        appIcon: 'edit_note',
        scopeLabel: 'Workspace',
        title: markdownRootPath ? 'Markdown Workspace' : 'Markdown Workspace',
        content: lazyContent(<MarkdownWorkspaceSettingsPage onClose={onClose} />)
      },
      {
        id: 'papers-global',
        appId: 'papers',
        appLabel: 'Papers',
        appIcon: 'article',
        scopeLabel: 'Global',
        title: 'Papers Global',
        content: lazyContent(<PapersGlobalSettingsPage onClose={onClose} />)
      },
      {
        id: 'papers-workspace',
        appId: 'papers',
        appLabel: 'Papers',
        appIcon: 'article',
        scopeLabel: 'Workspace',
        title: papersLibraryRoot ? 'Papers Workspace' : 'Papers Workspace',
        content: lazyContent(<PapersWorkspaceSettingsPage onClose={onClose} />)
      },
      {
        id: 'requester-workspace',
        appId: 'requester',
        appLabel: 'Requester',
        appIcon: 'api',
        scopeLabel: 'Workspace',
        title: requesterWorkspaceId ? 'Requester Workspace' : 'Requester Workspace',
        content: lazyContent(<RequesterWorkspaceSettingsPage onClose={onClose} />)
      },
      {
        id: 'rss-global',
        appId: 'rss',
        appLabel: 'RSS',
        appIcon: 'rss_feed',
        scopeLabel: 'Global',
        title: 'RSS Global',
        content: lazyContent(<RssGlobalSettingsPage onClose={onClose} />)
      },
      {
        id: 'db-inspector-global',
        appId: 'db-inspector',
        appLabel: 'DB Inspector',
        appIcon: 'storage',
        scopeLabel: 'Global',
        title: 'DB Inspector Global',
        content: lazyContent(<DbInspectorGlobalSettingsPage onClose={onClose} />)
      },
      {
        id: 'db-inspector-workspace',
        appId: 'db-inspector',
        appLabel: 'DB Inspector',
        appIcon: 'storage',
        scopeLabel: 'Workspace',
        title: dbInspectorWorkspaceId ? 'DB Inspector Workspace' : 'DB Inspector Workspace',
        content: lazyContent(<DbInspectorWorkspaceSettingsPage onClose={onClose} />)
      },
      {
        id: 'pdf-viewer-global',
        appId: 'pdf-viewer',
        appLabel: 'PDF Viewer',
        appIcon: 'picture_as_pdf',
        scopeLabel: 'Global',
        title: 'PDF Viewer Global',
        content: lazyContent(<PdfViewerGlobalSettingsPage onClose={onClose} />)
      },
      {
        id: 'pdf-viewer-workspace',
        appId: 'pdf-viewer',
        appLabel: 'PDF Viewer',
        appIcon: 'picture_as_pdf',
        scopeLabel: 'Workspace',
        title: pdfViewerRootPath ? 'PDF Viewer Workspace' : 'PDF Viewer Workspace',
        content: lazyContent(<PdfViewerWorkspaceSettingsPage onClose={onClose} />)
      }
    ],
    [
      dbInspectorWorkspaceId,
      markdownRootPath,
      onClose,
      onFontSettingsChange,
      papersLibraryRoot,
      pdfViewerRootPath,
      requesterWorkspaceId
    ]
  );

  useEffect(() => {
    if (!isOpen) return;
    const hasActiveWorkspace =
      activeAppId === 'markdown'
        ? Boolean(markdownRootPath)
        : activeAppId === 'papers'
          ? Boolean(papersLibraryRoot)
          : activeAppId === 'requester'
            ? Boolean(requesterWorkspaceId)
            : activeAppId === 'db-inspector'
              ? Boolean(dbInspectorWorkspaceId)
              : activeAppId === 'pdf-viewer'
                ? Boolean(pdfViewerRootPath)
                : false;
    setActivePageId(getInitialPageId(activeAppId, hasActiveWorkspace));
  }, [
    activeAppId,
    dbInspectorWorkspaceId,
    isOpen,
    markdownRootPath,
    papersLibraryRoot,
    pdfViewerRootPath,
    requesterWorkspaceId
  ]);

  return (
    <SettingsCenterDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      ariaLabel="Settings"
      pages={pages}
      activePageId={activePageId}
      onActivePageChange={setActivePageId}
    />
  );
};

const lazyContent = (content: React.ReactNode): React.JSX.Element => (
  <Suspense fallback={null}>{content}</Suspense>
);

const getInitialPageId = (appId: AppId, hasWorkspace: boolean): string => {
  if (appId === 'markdown') return hasWorkspace ? 'markdown-workspace' : 'tnet-fonts';
  if (appId === 'tasks') return 'tasks-global';
  if (appId === 'papers') return hasWorkspace ? 'papers-workspace' : 'papers-global';
  if (appId === 'requester') return hasWorkspace ? 'requester-workspace' : 'tnet-fonts';
  if (appId === 'rss') return 'rss-global';
  if (appId === 'db-inspector') {
    return hasWorkspace ? 'db-inspector-workspace' : 'db-inspector-global';
  }
  if (appId === 'pdf-viewer') return hasWorkspace ? 'pdf-viewer-workspace' : 'pdf-viewer-global';
  return 'tasks-global';
};

const GlobalFontSettingsPage = ({
  onClose,
  onFontSettingsChange
}: {
  onClose: () => void;
  onFontSettingsChange: (settings: GlobalFontSettings) => void;
}): React.JSX.Element => {
  const [draft, setDraft] = useState<GlobalFontSettings>(defaultGlobalFontSettings());

  useEffect(() => {
    let canceled = false;
    tnetApi.config
      .loadGlobal()
      .then((config) => {
        if (!canceled) setDraft(getGlobalFontSettings(normalizeGlobalConfig(config)));
      })
      .catch((error: unknown) => {
        console.error('Failed to load global font settings', error);
        if (!canceled) setDraft(defaultGlobalFontSettings());
      });

    return () => {
      canceled = true;
    };
  }, []);

  const updateDraft = <Key extends keyof GlobalFontSettings>(
    key: Key,
    value: GlobalFontSettings[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
    const nextConfig = withGlobalFontSettings(config, draft);
    const nextFonts = getGlobalFontSettings(nextConfig);
    await tnetApi.config.saveGlobal(nextConfig);
    onFontSettingsChange(nextFonts);
    onClose();
  };

  return (
    <>
      <SettingsFieldsSection
        title="Standard Font"
        draft={draft}
        fields={standardFontFields}
        onFieldChange={updateDraft}
      />
      <SettingsFieldsSection
        title="Monospace Font"
        draft={draft}
        fields={monospaceFontFields}
        onFieldChange={updateDraft}
      />
      <SettingsActions>
        <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
        <SettingsPrimaryButton
          onClick={() => {
            saveSettings().catch((error: unknown) => {
              console.error('Failed to save global font settings', error);
            });
          }}
        >
          Save
        </SettingsPrimaryButton>
      </SettingsActions>
    </>
  );
};

const standardFontFields: ReadonlyArray<SettingsFieldConfig<GlobalFontSettings>> = [
  {
    id: 'tnet-standard-font-family',
    label: 'Font family',
    key: 'standardFontFamily',
    type: 'text'
  },
  {
    id: 'tnet-standard-font-size',
    label: 'Font size (px)',
    key: 'standardFontSize',
    type: 'number',
    min: 8,
    max: 48
  }
];

const monospaceFontFields: ReadonlyArray<SettingsFieldConfig<GlobalFontSettings>> = [
  {
    id: 'tnet-monospace-font-family',
    label: 'Font family',
    key: 'monospaceFontFamily',
    type: 'text'
  },
  {
    id: 'tnet-monospace-font-size',
    label: 'Font size (px)',
    key: 'monospaceFontSize',
    type: 'number',
    min: 8,
    max: 48
  }
];
