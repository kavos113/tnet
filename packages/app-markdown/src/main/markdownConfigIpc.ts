import { ipcMain } from 'electron';
import { markdownIpcChannels } from '@tnet/app-markdown/shared/ipc';
import type { MarkdownProjectConfig } from '@tnet/app-markdown/shared/config';
import { loadMarkdownProjectConfig, saveMarkdownProjectConfig } from './markdownConfigService';

export const registerMarkdownConfigIpc = (): void => {
  ipcMain.handle(markdownIpcChannels.config.loadProject, async (_event, rootDir: string) =>
    loadMarkdownProjectConfig(rootDir)
  );
  ipcMain.handle(
    markdownIpcChannels.config.saveProject,
    async (_event, rootDir: string, config: MarkdownProjectConfig) =>
      saveMarkdownProjectConfig(rootDir, config)
  );
};
