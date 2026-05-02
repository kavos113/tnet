import type { AppId } from '@tnet/shared/app/appTypes';
import { CodeApp } from '@renderer/apps/code/CodeApp';
import {
  PapersApp,
  PapersRuntime,
  PapersSettingsDialog,
  PapersSidebar
} from '@tnet/app-papers/renderer';
import {
  RequesterApp,
  RequesterRuntime,
  RequesterSettingsDialog,
  RequesterSidebar
} from '@tnet/app-requester/renderer';
import {
  DbInspectorApp,
  DbInspectorRuntime,
  DbInspectorSettingsDialog,
  DbInspectorSidebar
} from '@tnet/app-db-inspector/renderer';
import {
  MarkdownApp,
  type MarkdownAppProps,
  MarkdownRuntime,
  MarkdownSettingsDialog,
  MarkdownSidebar
} from '@tnet/app-markdown/renderer';
import {
  TasksApp,
  type TasksAppProps,
  TasksRuntime,
  TasksSettingsDialog,
  TasksSidebar
} from '@tnet/app-tasks/renderer';
import {
  PdfViewerApp,
  PdfViewerRuntime,
  PdfViewerSettingsDialog,
  PdfViewerSidebar
} from '@tnet/app-pdf-viewer/renderer';
import { RssApp, RssRuntime, RssSettingsDialog, RssSidebar } from '@tnet/app-rss/renderer';

export interface AppModule {
  id: AppId;
  label: string;
  icon: string;
  Main:
    | React.ComponentType<TasksAppProps>
    | React.ComponentType<MarkdownAppProps>
    | React.ComponentType;
  Sidebar?: React.ComponentType;
  Runtime?: React.ComponentType;
  Settings?: React.ComponentType<{ isOpen: boolean; onClose: () => void }>;
}

export const appRegistry: AppModule[] = [
  {
    id: 'tasks',
    label: 'Tasks',
    icon: 'task_alt',
    Main: TasksApp,
    Sidebar: TasksSidebar,
    Runtime: TasksRuntime,
    Settings: TasksSettingsDialog
  },
  {
    id: 'markdown',
    label: 'Markdown',
    icon: 'edit_note',
    Main: MarkdownApp,
    Sidebar: MarkdownSidebar,
    Runtime: MarkdownRuntime,
    Settings: MarkdownSettingsDialog
  },
  {
    id: 'papers',
    label: 'Papers',
    icon: 'article',
    Main: PapersApp,
    Sidebar: PapersSidebar,
    Runtime: PapersRuntime,
    Settings: PapersSettingsDialog
  },
  {
    id: 'requester',
    label: 'Requester',
    icon: 'api',
    Main: RequesterApp,
    Sidebar: RequesterSidebar,
    Runtime: RequesterRuntime,
    Settings: RequesterSettingsDialog
  },
  {
    id: 'rss',
    label: 'RSS',
    icon: 'rss_feed',
    Main: RssApp,
    Sidebar: RssSidebar,
    Runtime: RssRuntime,
    Settings: RssSettingsDialog
  },
  {
    id: 'db-inspector',
    label: 'DB Inspector',
    icon: 'storage',
    Main: DbInspectorApp,
    Sidebar: DbInspectorSidebar,
    Runtime: DbInspectorRuntime,
    Settings: DbInspectorSettingsDialog
  },
  {
    id: 'pdf-viewer',
    label: 'PDF Viewer',
    icon: 'picture_as_pdf',
    Main: PdfViewerApp,
    Sidebar: PdfViewerSidebar,
    Runtime: PdfViewerRuntime,
    Settings: PdfViewerSettingsDialog
  },
  {
    id: 'code',
    label: 'Code',
    icon: 'code',
    Main: CodeApp
  }
];

export const getAppModule = (appId: AppId): AppModule =>
  appRegistry.find((app) => app.id === appId) ?? appRegistry[0];
