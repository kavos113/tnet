import { ipcMain } from 'electron';
import { markdownIpcChannels } from '@tnet/app-markdown/shared/ipc';
import type { InlineCompletionRequest } from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { getInlineCompletion } from './llm/inlineCompletionService';

export const registerMarkdownLlmIpc = (): void => {
  ipcMain.handle(
    markdownIpcChannels.llm.getInlineCompletion,
    async (_event, request: InlineCompletionRequest) => getInlineCompletion(request)
  );
};
