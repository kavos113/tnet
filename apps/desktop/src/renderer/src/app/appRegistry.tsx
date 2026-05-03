import { lazy } from 'react';
import type { AppId } from '@tnet/shared/app/appTypes';
import type { MarkdownAppProps } from '@tnet/app-markdown/renderer';
import type { TasksAppProps } from '@tnet/app-tasks/renderer';

const CodeApp = lazy(() =>
  import('@renderer/apps/code/CodeApp').then((module) => ({ default: module.CodeApp }))
);
const PapersApp = lazy(() =>
  import('@tnet/app-papers/renderer').then((module) => ({ default: module.PapersApp }))
);
const PapersRuntime = lazy(() =>
  import('@tnet/app-papers/renderer').then((module) => ({ default: module.PapersRuntime }))
);
const PapersSettingsDialog = lazy(() =>
  import('@tnet/app-papers/renderer').then((module) => ({
    default: module.PapersSettingsDialog
  }))
);
const PapersSidebar = lazy(() =>
  import('@tnet/app-papers/renderer').then((module) => ({ default: module.PapersSidebar }))
);
const RequesterApp = lazy(() =>
  import('@tnet/app-requester/renderer').then((module) => ({ default: module.RequesterApp }))
);
const RequesterRuntime = lazy(() =>
  import('@tnet/app-requester/renderer').then((module) => ({
    default: module.RequesterRuntime
  }))
);
const RequesterSettingsDialog = lazy(() =>
  import('@tnet/app-requester/renderer').then((module) => ({
    default: module.RequesterSettingsDialog
  }))
);
const RequesterSidebar = lazy(() =>
  import('@tnet/app-requester/renderer').then((module) => ({
    default: module.RequesterSidebar
  }))
);
const DbInspectorApp = lazy(() =>
  import('@tnet/app-db-inspector/renderer').then((module) => ({
    default: module.DbInspectorApp
  }))
);
const DbInspectorRuntime = lazy(() =>
  import('@tnet/app-db-inspector/renderer').then((module) => ({
    default: module.DbInspectorRuntime
  }))
);
const DbInspectorSettingsDialog = lazy(() =>
  import('@tnet/app-db-inspector/renderer').then((module) => ({
    default: module.DbInspectorSettingsDialog
  }))
);
const DbInspectorSidebar = lazy(() =>
  import('@tnet/app-db-inspector/renderer').then((module) => ({
    default: module.DbInspectorSidebar
  }))
);
const MarkdownApp = lazy(() =>
  import('@tnet/app-markdown/renderer').then((module) => ({ default: module.MarkdownApp }))
);
const MarkdownRuntime = lazy(() =>
  import('@tnet/app-markdown/renderer').then((module) => ({ default: module.MarkdownRuntime }))
);
const MarkdownSettingsDialog = lazy(() =>
  import('@tnet/app-markdown/renderer').then((module) => ({
    default: module.MarkdownSettingsDialog
  }))
);
const MarkdownSidebar = lazy(() =>
  import('@tnet/app-markdown/renderer').then((module) => ({ default: module.MarkdownSidebar }))
);
const TasksApp = lazy(() =>
  import('@tnet/app-tasks/renderer').then((module) => ({ default: module.TasksApp }))
);
const TasksRuntime = lazy(() =>
  import('@tnet/app-tasks/renderer').then((module) => ({ default: module.TasksRuntime }))
);
const TasksSettingsDialog = lazy(() =>
  import('@tnet/app-tasks/renderer').then((module) => ({
    default: module.TasksSettingsDialog
  }))
);
const TasksSidebar = lazy(() =>
  import('@tnet/app-tasks/renderer').then((module) => ({ default: module.TasksSidebar }))
);
const PdfViewerApp = lazy(() =>
  import('@tnet/app-pdf-viewer/renderer').then((module) => ({ default: module.PdfViewerApp }))
);
const PdfViewerRuntime = lazy(() =>
  import('@tnet/app-pdf-viewer/renderer').then((module) => ({
    default: module.PdfViewerRuntime
  }))
);
const PdfViewerSettingsDialog = lazy(() =>
  import('@tnet/app-pdf-viewer/renderer').then((module) => ({
    default: module.PdfViewerSettingsDialog
  }))
);
const PdfViewerSidebar = lazy(() =>
  import('@tnet/app-pdf-viewer/renderer').then((module) => ({
    default: module.PdfViewerSidebar
  }))
);
const RssApp = lazy(() =>
  import('@tnet/app-rss/renderer').then((module) => ({ default: module.RssApp }))
);
const RssRuntime = lazy(() =>
  import('@tnet/app-rss/renderer').then((module) => ({ default: module.RssRuntime }))
);
const RssSettingsDialog = lazy(() =>
  import('@tnet/app-rss/renderer').then((module) => ({ default: module.RssSettingsDialog }))
);
const RssSidebar = lazy(() =>
  import('@tnet/app-rss/renderer').then((module) => ({ default: module.RssSidebar }))
);

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
    id: 'rss',
    label: 'RSS',
    icon: 'rss_feed',
    Main: RssApp,
    Sidebar: RssSidebar,
    Runtime: RssRuntime,
    Settings: RssSettingsDialog
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
