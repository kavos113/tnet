import { beforeEach, describe, expect, it, vi } from 'vitest';

const electronMock = vi.hoisted(() => ({
  dialog: {
    showOpenDialog: vi.fn()
  },
  shell: {
    openPath: vi.fn()
  }
}));

vi.mock('electron', () => ({
  dialog: electronMock.dialog,
  shell: electronMock.shell
}));

describe('papersFileService', () => {
  beforeEach(() => {
    electronMock.dialog.showOpenDialog.mockReset();
    electronMock.shell.openPath.mockReset();
  });

  it('selects a pdf import candidate without touching the database', async () => {
    const { selectPdfForImport } = await import('./papersFileService');
    electronMock.dialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\outside\\paper.pdf']
    });

    await expect(
      selectPdfForImport({ libraryRoot: 'C:\\library', directoryPath: 'articles' })
    ).resolves.toEqual({
      sourcePath: 'C:\\outside\\paper.pdf',
      suggestedTitle: 'paper',
      sourceRelativePath: undefined,
      willCopy: true,
      targetDirectoryPath: 'articles'
    });
  });

  it('opens a pdf with the OS-associated application', async () => {
    const { openPdfExternal } = await import('./papersFileService');

    await openPdfExternal('C:\\library', 'papers/paper.pdf');

    expect(electronMock.shell.openPath).toHaveBeenCalledWith('C:\\library\\papers\\paper.pdf');
  });
});
