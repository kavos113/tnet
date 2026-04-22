import { ipcMain } from 'electron';
import { getInlineCompletion } from '@main/services/llm/inlineCompletionService';
import { ipcChannels } from '@shared/ipc/channels';
import type { InlineCompletionRequest } from '@shared/llm/inlineCompletionTypes';

export const registerLlmIpc = (): void => {
  ipcMain.handle(
    ipcChannels.llm.getInlineCompletion,
    async (_event, request: InlineCompletionRequest) => getInlineCompletion(request)
  );
};
