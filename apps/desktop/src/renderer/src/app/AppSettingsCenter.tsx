import { useEffect, useMemo, useState } from 'react';
import type { AppId } from '@tnet/shared/app/appTypes';
import {
  MarkdownGlobalSettingsPage,
  MarkdownWorkspaceSettingsPage
} from '@tnet/app-markdown/renderer';
import { PapersGlobalSettingsPage, PapersWorkspaceSettingsPage } from '@tnet/app-papers/renderer';
import {
  RequesterGlobalSettingsPage,
  RequesterWorkspaceSettingsPage
} from '@tnet/app-requester/renderer';
import {
  DbInspectorGlobalSettingsPage,
  DbInspectorWorkspaceSettingsPage
} from '@tnet/app-db-inspector/renderer';
import { TasksGlobalSettingsPage } from '@tnet/app-tasks/renderer';
import {
  PdfViewerGlobalSettingsPage,
  PdfViewerWorkspaceSettingsPage
} from '@tnet/app-pdf-viewer/renderer';
import { SettingsCenterDialog, type SettingsCenterPage } from '@tnet/ui/settings';
import { useAppSelector } from './hooks';

interface AppSettingsCenterProps {
  isOpen: boolean;
  activeAppId: AppId;
  onClose: () => void;
}

export const AppSettingsCenter = ({
  isOpen,
  activeAppId,
  onClose
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
        id: 'tasks-global',
        appId: 'tasks',
        appLabel: 'Tasks',
        appIcon: 'task_alt',
        scopeLabel: 'Global',
        title: 'Tasks Global',
        content: <TasksGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'markdown-global',
        appId: 'markdown',
        appLabel: 'Markdown',
        appIcon: 'edit_note',
        scopeLabel: 'Global',
        title: 'Markdown Global',
        content: <MarkdownGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'markdown-workspace',
        appId: 'markdown',
        appLabel: 'Markdown',
        appIcon: 'edit_note',
        scopeLabel: 'Workspace',
        title: markdownRootPath ? 'Markdown Workspace' : 'Markdown Workspace',
        content: <MarkdownWorkspaceSettingsPage onClose={onClose} />
      },
      {
        id: 'papers-global',
        appId: 'papers',
        appLabel: 'Papers',
        appIcon: 'article',
        scopeLabel: 'Global',
        title: 'Papers Global',
        content: <PapersGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'papers-workspace',
        appId: 'papers',
        appLabel: 'Papers',
        appIcon: 'article',
        scopeLabel: 'Workspace',
        title: papersLibraryRoot ? 'Papers Workspace' : 'Papers Workspace',
        content: <PapersWorkspaceSettingsPage onClose={onClose} />
      },
      {
        id: 'requester-global',
        appId: 'requester',
        appLabel: 'Requester',
        appIcon: 'api',
        scopeLabel: 'Global',
        title: 'Requester Global',
        content: <RequesterGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'requester-workspace',
        appId: 'requester',
        appLabel: 'Requester',
        appIcon: 'api',
        scopeLabel: 'Workspace',
        title: requesterWorkspaceId ? 'Requester Workspace' : 'Requester Workspace',
        content: <RequesterWorkspaceSettingsPage onClose={onClose} />
      },
      {
        id: 'db-inspector-global',
        appId: 'db-inspector',
        appLabel: 'DB Inspector',
        appIcon: 'storage',
        scopeLabel: 'Global',
        title: 'DB Inspector Global',
        content: <DbInspectorGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'db-inspector-workspace',
        appId: 'db-inspector',
        appLabel: 'DB Inspector',
        appIcon: 'storage',
        scopeLabel: 'Workspace',
        title: dbInspectorWorkspaceId ? 'DB Inspector Workspace' : 'DB Inspector Workspace',
        content: <DbInspectorWorkspaceSettingsPage onClose={onClose} />
      },
      {
        id: 'pdf-viewer-global',
        appId: 'pdf-viewer',
        appLabel: 'PDF Viewer',
        appIcon: 'picture_as_pdf',
        scopeLabel: 'Global',
        title: 'PDF Viewer Global',
        content: <PdfViewerGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'pdf-viewer-workspace',
        appId: 'pdf-viewer',
        appLabel: 'PDF Viewer',
        appIcon: 'picture_as_pdf',
        scopeLabel: 'Workspace',
        title: pdfViewerRootPath ? 'PDF Viewer Workspace' : 'PDF Viewer Workspace',
        content: <PdfViewerWorkspaceSettingsPage onClose={onClose} />
      }
    ],
    [
      dbInspectorWorkspaceId,
      markdownRootPath,
      onClose,
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

const getInitialPageId = (appId: AppId, hasWorkspace: boolean): string => {
  if (appId === 'markdown') return hasWorkspace ? 'markdown-workspace' : 'markdown-global';
  if (appId === 'tasks') return 'tasks-global';
  if (appId === 'papers') return hasWorkspace ? 'papers-workspace' : 'papers-global';
  if (appId === 'requester') return hasWorkspace ? 'requester-workspace' : 'requester-global';
  if (appId === 'db-inspector') {
    return hasWorkspace ? 'db-inspector-workspace' : 'db-inspector-global';
  }
  if (appId === 'pdf-viewer') return hasWorkspace ? 'pdf-viewer-workspace' : 'pdf-viewer-global';
  return 'tasks-global';
};
