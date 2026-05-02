import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import {
  defaultPapersGlobalSettings,
  type PapersGlobalSettings
} from '@tnet/app-papers/shared/config';
import { papersIpcChannels } from '@tnet/app-papers/shared/ipc';
import { openPdfExternal, selectPdfForImport } from './papersFileService';
import { createPaperAiService } from './papersAiService';
import type { PapersServerClient } from './serverClient/papersServerClient';

type PaperAiHandlerRequest = Parameters<ReturnType<typeof createPaperAiService>['run']>[0];

export const registerPapersDataIpc = (
  serverClient: PapersServerClient,
  settingsLoader: () => Promise<PapersGlobalSettings> = async () => defaultPapersGlobalSettings()
): void => {
  const aiService = createPaperAiService({ serverClient, settingsLoader });
  ipcMain.handle(papersIpcChannels.library.selectPdf, async (_event, request) =>
    selectPdfForImport(request)
  );

  ipcMain.handle(papersIpcChannels.library.createPaperFromPdf, async (_event, request) =>
    serverClient.createPaperFromPdf(request)
  );

  ipcMain.handle(papersIpcChannels.library.createPaperFromPdfBytes, async (_event, request) =>
    serverClient.createPaperFromPdfBytes(request)
  );

  ipcMain.handle(papersIpcChannels.library.importPdf, async (_event, request) => {
    const candidate = await selectPdfForImport(request);
    if (!candidate) return null;

    return serverClient.createPaperFromPdf({
      libraryRoot: request.libraryRoot,
      sourcePath: candidate.sourcePath,
      title: candidate.suggestedTitle,
      directoryPath: request.directoryPath
    });
  });

  ipcMain.handle(papersIpcChannels.papers.list, async (_event, request) =>
    serverClient.listPapers(request)
  );

  ipcMain.handle(papersIpcChannels.papers.get, async (_event, request) =>
    serverClient.getPaper(request)
  );

  ipcMain.handle(papersIpcChannels.tags.list, async (_event, request) =>
    serverClient.listTags(request)
  );

  ipcMain.handle(papersIpcChannels.tags.upsert, async (_event, request) =>
    serverClient.upsertTag(request)
  );

  ipcMain.handle(papersIpcChannels.tags.attach, async (_event, request) =>
    serverClient.attachTag(request)
  );

  ipcMain.handle(papersIpcChannels.tags.detach, async (_event, request) =>
    serverClient.detachTag(request)
  );

  ipcMain.handle(papersIpcChannels.notes.save, async (_event, request) =>
    serverClient.saveNote(request)
  );

  ipcMain.handle(papersIpcChannels.pdf.loadBytes, async (_event, request) =>
    serverClient.loadPdfBytes(request)
  );

  ipcMain.handle(papersIpcChannels.pdf.openExternal, async (_event, request) =>
    openPdfExternal(request.libraryRoot, request.pdfPath)
  );

  const runAi = async (
    event: IpcMainInvokeEvent,
    request: PaperAiHandlerRequest
  ): Promise<Awaited<ReturnType<typeof aiService.run>>> => {
    const streamRequestId = request.streamRequestId;
    try {
      const output = await aiService.run(request, {
        onDelta: streamRequestId
          ? (delta) =>
              event.sender.send(papersIpcChannels.ai.streamEvent, {
                requestId: streamRequestId,
                type: 'delta',
                delta
              })
          : undefined
      });
      if (streamRequestId) {
        event.sender.send(papersIpcChannels.ai.streamEvent, {
          requestId: streamRequestId,
          type: 'done',
          content: output.content
        });
      }
      return output;
    } catch (error) {
      if (streamRequestId) {
        event.sender.send(papersIpcChannels.ai.streamEvent, {
          requestId: streamRequestId,
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to generate paper AI output.'
        });
      }
      throw error;
    }
  };

  ipcMain.handle(papersIpcChannels.ai.translatePdf, async (event, request) =>
    runAi(event, { ...request, operation: 'translate', inputMode: 'pdf-direct' })
  );
  ipcMain.handle(papersIpcChannels.ai.translateText, async (event, request) =>
    runAi(event, { ...request, operation: 'translate', inputMode: 'text' })
  );
  ipcMain.handle(papersIpcChannels.ai.summarizePdf, async (event, request) =>
    runAi(event, { ...request, operation: 'summary', inputMode: 'pdf-direct' })
  );
  ipcMain.handle(papersIpcChannels.ai.summarizeText, async (event, request) =>
    runAi(event, { ...request, operation: 'summary', inputMode: 'text' })
  );
};
