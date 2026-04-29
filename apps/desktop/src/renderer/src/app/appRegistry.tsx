import type { AppId } from '@tnet/shared/app/appTypes';
import { CodeApp } from '@renderer/apps/code/CodeApp';
import { PapersApp, PapersRuntime, PapersSidebar } from '@tnet/app-papers/renderer';
import {
  MarkdownApp,
  MarkdownRuntime,
  MarkdownSettingsDialog,
  MarkdownSidebar
} from '@tnet/app-markdown/renderer';

export interface AppModule {
  id: AppId;
  label: string;
  icon: string;
  Main: React.ComponentType;
  Sidebar?: React.ComponentType;
  Runtime?: React.ComponentType;
  Settings?: React.ComponentType<{ isOpen: boolean; onClose: () => void }>;
}

export const appRegistry: AppModule[] = [
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
    Runtime: PapersRuntime
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
