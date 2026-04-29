import { ipcMain } from 'electron';
import { papersIpcChannels } from '@tnet/app-papers/shared/ipc';
import {
  createPaperFromPdf,
  importPdfFromDialog,
  loadPdfBytes,
  openPdfExternal,
  selectPdfForImport
} from './papersFileService';
import { openPapersDatabase } from './papersDatabase';
import { PapersRepository } from './papersRepository';

const withRepository = async <T>(
  libraryRoot: string,
  run: (repository: PapersRepository) => T
): Promise<T> => {
  const database = await openPapersDatabase(libraryRoot);
  try {
    return run(new PapersRepository(database));
  } finally {
    database.close();
  }
};

export const registerPapersDataIpc = (): void => {
  ipcMain.handle(papersIpcChannels.library.selectPdf, async (_event, request) =>
    selectPdfForImport(request)
  );

  ipcMain.handle(papersIpcChannels.library.createPaperFromPdf, async (_event, request) =>
    createPaperFromPdf(request)
  );

  ipcMain.handle(papersIpcChannels.library.importPdf, async (_event, request) =>
    importPdfFromDialog(request)
  );

  ipcMain.handle(papersIpcChannels.papers.list, async (_event, request) =>
    withRepository(request.libraryRoot, (repository) => repository.listPapers(request))
  );

  ipcMain.handle(papersIpcChannels.papers.get, async (_event, request) =>
    withRepository(request.libraryRoot, (repository) => repository.getPaper(request.paperId))
  );

  ipcMain.handle(papersIpcChannels.tags.list, async (_event, request) =>
    withRepository(request.libraryRoot, (repository) => repository.listTags())
  );

  ipcMain.handle(papersIpcChannels.tags.upsert, async (_event, request) =>
    withRepository(request.libraryRoot, (repository) =>
      repository.upsertTag(request.name, request.color)
    )
  );

  ipcMain.handle(papersIpcChannels.tags.attach, async (_event, request) =>
    withRepository(request.libraryRoot, (repository) =>
      repository.attachTag(request.paperId, request.tagId)
    )
  );

  ipcMain.handle(papersIpcChannels.tags.detach, async (_event, request) =>
    withRepository(request.libraryRoot, (repository) =>
      repository.detachTag(request.paperId, request.tagId)
    )
  );

  ipcMain.handle(papersIpcChannels.pdf.loadBytes, async (_event, request) =>
    loadPdfBytes(request.libraryRoot, request.pdfPath)
  );

  ipcMain.handle(papersIpcChannels.pdf.openExternal, async (_event, request) =>
    openPdfExternal(request.libraryRoot, request.pdfPath)
  );
};
