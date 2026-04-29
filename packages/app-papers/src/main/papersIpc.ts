import { ipcMain } from 'electron';
import { papersIpcChannels } from '@tnet/app-papers/shared/ipc';
import { openPdfExternal, selectPdfForImport } from './papersFileService';
import type { PapersServerClient } from './serverClient/papersServerClient';

export const registerPapersDataIpc = (serverClient: PapersServerClient): void => {
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
};
