import { ipcMain } from 'electron';
import { markdownIpcChannels } from '@tnet/app-markdown/shared/ipc';
import type {
  InlineCompletionRequest,
  InlineCompletionStreamCancelRequest,
  InlineCompletionStreamRequest
} from '@tnet/app-markdown/shared/llm/inlineCompletionTypes';
import { getInlineCompletion } from './llm/inlineCompletionService';

export const registerMarkdownLlmIpc = (): void => {
  const activeStreams = new Map<string, AbortController>();

  ipcMain.handle(
    markdownIpcChannels.llm.getInlineCompletion,
    async (_event, request: InlineCompletionRequest) => getInlineCompletion(request)
  );

  ipcMain.handle(
    markdownIpcChannels.llm.startInlineCompletionStream,
    async (event, request: InlineCompletionStreamRequest) => {
      const { streamRequestId, ...completionRequest } = request;
      activeStreams.get(streamRequestId)?.abort();
      const controller = new AbortController();
      activeStreams.set(streamRequestId, controller);

      try {
        const result = await getInlineCompletion(completionRequest, {
          signal: controller.signal,
          onDelta: (delta) =>
            event.sender.send(markdownIpcChannels.llm.inlineCompletionStreamEvent, {
              requestId: streamRequestId,
              type: 'delta',
              delta
            })
        });
        event.sender.send(markdownIpcChannels.llm.inlineCompletionStreamEvent, {
          requestId: streamRequestId,
          type: 'done',
          content: result?.text ?? '',
          result
        });
        return result;
      } catch (error) {
        event.sender.send(markdownIpcChannels.llm.inlineCompletionStreamEvent, {
          requestId: streamRequestId,
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to generate inline completion.'
        });
        throw error;
      } finally {
        if (activeStreams.get(streamRequestId) === controller) {
          activeStreams.delete(streamRequestId);
        }
      }
    }
  );

  ipcMain.handle(
    markdownIpcChannels.llm.cancelInlineCompletionStream,
    async (_event, request: InlineCompletionStreamCancelRequest) => {
      activeStreams.get(request.streamRequestId)?.abort();
      activeStreams.delete(request.streamRequestId);
    }
  );
};
