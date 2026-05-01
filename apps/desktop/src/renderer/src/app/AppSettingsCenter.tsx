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
  const [activePageId, setActivePageId] = useState(() => getInitialPageId(activeAppId, true));

  const pages = useMemo<SettingsCenterPage[]>(
    () => [
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
        appIcon: 'database',
        scopeLabel: 'Global',
        title: 'DB Inspector Global',
        content: <DbInspectorGlobalSettingsPage onClose={onClose} />
      },
      {
        id: 'db-inspector-workspace',
        appId: 'db-inspector',
        appLabel: 'DB Inspector',
        appIcon: 'database',
        scopeLabel: 'Workspace',
        title: dbInspectorWorkspaceId ? 'DB Inspector Workspace' : 'DB Inspector Workspace',
        content: <DbInspectorWorkspaceSettingsPage onClose={onClose} />
      }
    ],
    [dbInspectorWorkspaceId, markdownRootPath, onClose, papersLibraryRoot, requesterWorkspaceId]
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
              : false;
    setActivePageId(getInitialPageId(activeAppId, hasActiveWorkspace));
  }, [
    activeAppId,
    dbInspectorWorkspaceId,
    isOpen,
    markdownRootPath,
    papersLibraryRoot,
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
  if (appId === 'papers') return hasWorkspace ? 'papers-workspace' : 'papers-global';
  if (appId === 'requester') return hasWorkspace ? 'requester-workspace' : 'requester-global';
  if (appId === 'db-inspector') {
    return hasWorkspace ? 'db-inspector-workspace' : 'db-inspector-global';
  }
  return 'markdown-global';
};
