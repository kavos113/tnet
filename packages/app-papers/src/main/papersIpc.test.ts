import { beforeEach, describe, expect, it, vi } from 'vitest';
import { papersIpcChannels } from '@tnet/app-papers/shared/ipc';

const electronMock = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  return {
    handlers,
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      })
    },
    shell: {
      openPath: vi.fn()
    },
    dialog: {
      showOpenDialog: vi.fn()
    }
  };
});

vi.mock('electron', () => ({
  ipcMain: electronMock.ipcMain,
  shell: electronMock.shell,
  dialog: electronMock.dialog
}));

describe('registerPapersDataIpc', () => {
  beforeEach(() => {
    electronMock.handlers.clear();
    electronMock.ipcMain.handle.mockClear();
  });

  it('proxies paper list requests to the server client', async () => {
    const { registerPapersDataIpc } = await import('./papersIpc');
    const client = {
      listPapers: vi.fn(async () => [{ id: 'paper-1', title: 'Paper' }])
    };

    registerPapersDataIpc(client as never);
    const handler = electronMock.handlers.get(papersIpcChannels.papers.list);

    await expect(handler?.({}, { libraryRoot: 'C:/papers', query: 'abc' })).resolves.toEqual([
      { id: 'paper-1', title: 'Paper' }
    ]);
    expect(client.listPapers).toHaveBeenCalledWith({ libraryRoot: 'C:/papers', query: 'abc' });
  });

  it('keeps import dialog in Electron and creates through the server client', async () => {
    const { registerPapersDataIpc } = await import('./papersIpc');
    electronMock.dialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\outside\\paper.pdf']
    });
    const client = {
      createPaperFromPdf: vi.fn(async () => ({ id: 'paper-1', title: 'paper' }))
    };

    registerPapersDataIpc(client as never);
    const handler = electronMock.handlers.get(papersIpcChannels.library.importPdf);

    await expect(
      handler?.({}, { libraryRoot: 'C:\\library', directoryPath: 'articles' })
    ).resolves.toEqual({ id: 'paper-1', title: 'paper' });
    expect(client.createPaperFromPdf).toHaveBeenCalledWith({
      libraryRoot: 'C:\\library',
      sourcePath: 'C:\\outside\\paper.pdf',
      title: 'paper',
      directoryPath: 'articles'
    });
  });
});
