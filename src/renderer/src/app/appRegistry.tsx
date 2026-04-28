import type { AppId } from '@shared/app/appTypes';
import { CodeApp } from '@renderer/apps/code/CodeApp';
import { MarkdownApp } from '@renderer/apps/markdown/MarkdownApp';
import { MarkdownRuntime } from '@renderer/apps/markdown/MarkdownRuntime';
import { MarkdownSidebar } from '@renderer/apps/markdown/MarkdownSidebar';
import { PapersApp } from '@renderer/apps/papers/PapersApp';

export interface AppModule {
  id: AppId;
  label: string;
  icon: string;
  Main: React.ComponentType;
  Sidebar?: React.ComponentType;
  Runtime?: React.ComponentType;
}

export const appRegistry: AppModule[] = [
  {
    id: 'markdown',
    label: 'Markdown',
    icon: 'edit_note',
    Main: MarkdownApp,
    Sidebar: MarkdownSidebar,
    Runtime: MarkdownRuntime
  },
  {
    id: 'papers',
    label: 'Papers',
    icon: 'article',
    Main: PapersApp
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
