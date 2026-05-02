import { registerMarkdownIpcHandlers } from '@tnet/app-markdown/main';
import { registerPapersIpcHandlers } from '@tnet/app-papers/main';
import { registerRequesterIpcHandlers } from '@tnet/app-requester/main';
import { registerDbInspectorIpcHandlers } from '@tnet/app-db-inspector/main';
import { registerTasksIpcHandlers } from '@tnet/app-tasks/main';
import { registerPdfViewerIpcHandlers } from '@tnet/app-pdf-viewer/main';
import { registerRssIpcHandlers } from '@tnet/app-rss/main';
import { registerConfigIpc } from './configIpc';
import { registerFileIpc } from './fileIpc';
import { registerSessionIpc } from './sessionIpc';
import { registerWorkspaceIpc } from './workspaceIpc';
import { loadGlobalConfig, saveGlobalConfig } from '../services/configService';
import { loadSession, saveSession } from '../services/sessionService';
import { app } from 'electron';

export const registerIpcHandlers = (): void => {
  registerWorkspaceIpc();
  registerFileIpc();
  registerSessionIpc();
  registerConfigIpc();
  registerTasksIpcHandlers({
    userDataDir: app.getPath('userData')
  });
  registerPdfViewerIpcHandlers({
    loadGlobal: () => loadGlobalConfig(app.getPath('userData')),
    saveGlobal: (config) => saveGlobalConfig(app.getPath('userData'), config)
  });
  registerRssIpcHandlers({
    userDataDir: app.getPath('userData')
  });
  registerMarkdownIpcHandlers({ loadSession, saveSession });
  registerPapersIpcHandlers({
    loadGlobal: () => loadGlobalConfig(app.getPath('userData')),
    userDataDir: app.getPath('userData')
  });
  registerRequesterIpcHandlers({
    userDataDir: app.getPath('userData')
  });
  registerDbInspectorIpcHandlers({
    userDataDir: app.getPath('userData')
  });
};
